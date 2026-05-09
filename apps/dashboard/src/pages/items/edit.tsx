import { Button, Form, Input, InputNumber, Space, Typography } from "antd";
import { useNavigation } from "@refinedev/core";
import { useForm } from "@refinedev/antd";
import gql from "graphql-tag";

type EditItemValues = {
  name?: string;
  description?: string | null;
  price?: number;
};

const ITEM_ONE_QUERY = gql`
  query ItemOne($id: ID!) {
    item(id: $id) {
      id
      name
      description
      price
    }
  }
`;

const ITEM_UPDATE_MUTATION = gql`
  mutation ItemUpdate($input: UpdateOneItemInput!) {
    updateOneItem(input: $input) {
      id
      name
      description
      price
    }
  }
`;

export const ItemsEdit = () => {
  const { list } = useNavigation();
  const { formProps, saveButtonProps, query } = useForm<EditItemValues>({
    resource: "items",
    action: "edit",
    redirect: "list",
    meta: { gqlQuery: ITEM_ONE_QUERY, gqlMutation: ITEM_UPDATE_MUTATION },
  });

  return (
    <>
      <Typography.Title level={4}>Edit item</Typography.Title>
      <Form {...formProps} layout="vertical" style={{ maxWidth: 480 }}>
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Price" name="price" rules={[{ required: true }]}>
          <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
        </Form.Item>
        <Space>
          <Button {...saveButtonProps} loading={query?.isLoading}>
            Save
          </Button>
          <Button onClick={() => list("items")}>Cancel</Button>
        </Space>
      </Form>
    </>
  );
};
