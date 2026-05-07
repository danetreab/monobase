import { Table } from "antd";
import { useList } from "@refinedev/core";

type Item = {
  id: string;
  name: string;
  price: number;
};

export const ItemsList = () => {
  const { result, query } = useList<Item>({ resource: "items" });

  return (
    <Table
      rowKey="id"
      loading={query.isLoading}
      dataSource={result?.data ?? []}
      pagination={false}
      columns={[
        { title: "ID", dataIndex: "id" },
        { title: "Name", dataIndex: "name" },
        {
          title: "Price",
          dataIndex: "price",
          render: (v: number) => `$${v.toFixed(2)}`,
        },
      ]}
    />
  );
};
