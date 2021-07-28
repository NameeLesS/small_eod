import { QQ } from '@/utils/QQ';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import ProTable, { ActionType, ProColumns } from '@ant-design/pro-table';
import { Input, Row, Col } from 'antd';
import { ExpandableConfig } from 'antd/lib/table/interface';
import React, { MutableRefObject, useRef, useState } from 'react';
import { formatMessage } from 'umi-plugin-react/locale';
import { localeKeys } from '../../locales/pl-PL';
import { PaginationParams } from '../../services/common';
import { ReadOnlyServiceType, ResourceWithId } from '../../services/service';

const { Search } = Input;

function SearchContainer(props: { value: string; onSearch: (value: string) => void }) {
  const [value, setValue] = useState(props.value || '');
  return (
    <Search
      value={value}
      placeholder={formatMessage({ id: localeKeys.lists.filters })}
      onChange={e => setValue(e.target.value)}
      onSearch={props.onSearch}
      enterButton
    />
  );
}

interface TableProps<T extends ResourceWithId> {
  type: string;
  columns: ProColumns<T>[];
  service: ReadOnlyServiceType<T>;
  pageHeader?: string;
  tableHeader?: string;
  actionRef?: MutableRefObject<ActionType>;
  expandable?: ExpandableConfig<T>;
  disableFilter?: boolean;
  filters?: { [key: string]: any };
  inline?: boolean;
}

function Table<T extends ResourceWithId>({
  type,
  columns,
  service,
  pageHeader,
  tableHeader,
  actionRef,
  expandable,
  disableFilter,
  filters,
  inline,
}: TableProps<T>) {
  const initialQueryParametrs = new URLSearchParams(window.location.search);
  const localActionRef = useRef<ActionType>();
  const usedActionRef = actionRef || localActionRef;

  const [filter, setFilter] = useState<string>(initialQueryParametrs.get('filter') || '');
  const showTotal = (total: number, range: number[]) =>
    `${range[0]}-${range[1]} / ${formatMessage({ id: localeKeys.lists.total })} ${total}`;

  function onSearch(value: string) {
    setFilter(value);
    const queryParameters = new URLSearchParams();
    queryParameters.set('filter', value);
    window.history.replaceState({}, '', `${window.location.pathname}?${queryParameters}`);
    usedActionRef.current.reload();
  }

  const filterFromParams = filters
    ? Object.entries(filters).reduce(
        (acc, [field, value]) => QQ.and(acc, QQ.field(field, value)),
        '',
      )
    : '';

  function fetchFromService(props: PaginationParams) {
    return service.fetchPage({
      ...props,
      query: QQ.and(props.query, QQ.and(filter, filterFromParams)),
    });
  }

  const PageHeader = inline
    ? ({ children }) => <>{children}</>
    : ({ children }) => (
        <PageHeaderWrapper
          content={formatMessage({ id: pageHeader || `${type}-list.page-header-content` })}
        >
          {children}
        </PageHeaderWrapper>
      );

  return (
    <PageHeader>
      <Row gutter={[16, 16]}>
        {!disableFilter && !inline && (
          <Col span={24} className="gutter-row">
            <SearchContainer value={filter} onSearch={onSearch} />
          </Col>
        )}

        <Col span={24} className="gutter-row">
          <ProTable
            headerTitle={
              inline
                ? undefined
                : formatMessage({ id: tableHeader || `${type}-list.table-header-title` })
            }
            actionRef={actionRef}
            rowKey="id"
            request={fetchFromService}
            tableAlertRender={false}
            columns={columns}
            rowSelection={false}
            search={false}
            options={false}
            pagination={{
              pageSize: 20,
              showSizeChanger: false,
              showTotal,
            }}
            expandable={expandable}
          />
        </Col>
      </Row>
    </PageHeader>
  );
}

export default Table;
