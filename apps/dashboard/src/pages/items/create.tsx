import { Button, Form, Input, InputNumber, Space, Typography } from "antd";
import { useNavigation } from "@refinedev/core";
import { useForm } from "@refinedev/antd";
import gql from "graphql-tag";

type CreateItemValues = {
  name: string;
  description?: string | null;
  price: number;
};

const ITEM_CREATE_MUTATION = gql`
  mutation ItemCreate($input: CreateOneItemInput!) {
    createOneItem(input: $input) {
      id
      name
      description
      price
    }
  }
`;

export const ItemsCreate = () => {
  const { list } = useNavigation();
  const { formProps, saveButtonProps } = useForm<CreateItemValues>({
    resource: "items",
    action: "create",
    redirect: "list",
    meta: { gqlMutation: ITEM_CREATE_MUTATION },
  });

  return (
    <>
      <Typography.Title level={4}>Create item</Typography.Title>
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
          <Button {...saveButtonProps}>Save</Button>
          <Button onClick={() => list("items")}>Cancel</Button>
        </Space>
      </Form>
    </>
  );
};
