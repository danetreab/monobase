import { Button, Form, Input, Modal, Select, Space, Typography, message } from "antd";
import { CopyOutlined, LinkOutlined } from "@ant-design/icons";
import { useInvalidate } from "@refinedev/core";
import axios from "axios";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const gqlFetch = async <T,>(query: string, variables: Record<string, unknown>): Promise<T> => {
  const { data } = await axios.post<{ data?: T; errors?: { message: string }[] }>(
    `${baseUrl}/graphql/v1`,
    { query, variables },
    { withCredentials: true },
  );
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data as T;
};

const CREATE_USER_MUTATION = `
  mutation CreateAdminUser($input: CreateAdminUserInput!) {
    createAdminUser(input: $input) {
      user { id name email role }
      inviteToken
    }
  }
`;

export const UsersCreate = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const invalidate = useInvalidate();

  const passwordValue = Form.useWatch("password", form);

  const close = () => navigate(`/users${location.search}`);

  const handleSubmit = async (values: {
    name: string;
    email: string;
    role: string;
    password?: string;
  }) => {
    setLoading(true);
    try {
      const result = await gqlFetch<{
        createAdminUser: { user: unknown; inviteToken?: string };
      }>(CREATE_USER_MUTATION, {
        input: {
          name: values.name,
          email: values.email,
          role: values.role,
          password: values.password || undefined,
        },
      });

      await invalidate({ resource: "users", invalidates: ["list"] });

      const { inviteToken } = result.createAdminUser;
      if (inviteToken) {
        setInviteLink(`${window.location.origin}/accept-invite?token=${inviteToken}`);
        form.resetFields();
      } else {
        messageApi.success("User created successfully");
        close();
      }
    } catch (err: unknown) {
      messageApi.error((err as Error).message ?? "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      messageApi.success("Invite link copied!");
    });
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={inviteLink ? "User Created" : "Create User"}
        open
        onCancel={close}
        width={600}
        footer={
          inviteLink ? (
            <Space>
              <Button onClick={close}>Close</Button>
              <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyLink}>
                Copy Invite Link
              </Button>
            </Space>
          ) : null
        }
        destroyOnClose
      >
        {inviteLink ? (
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Typography.Text>
              User created. Share this link so they can set their password and
              activate their account.
            </Typography.Text>
            <Input
              value={inviteLink}
              readOnly
              prefix={<LinkOutlined />}
              suffix={
                <CopyOutlined style={{ cursor: "pointer" }} onClick={handleCopyLink} />
              }
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              The user will not be able to log in until they accept the invite.
              Link expires in 7 days.
            </Typography.Text>
          </Space>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ role: "user" }}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Name is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="role" label="Role">
              <Select>
                <Select.Option value="user">User</Select.Option>
                <Select.Option value="admin">Admin</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              extra="Leave blank to generate an invite link instead."
              rules={[{ min: 8, message: "Password must be at least 8 characters" }]}
            >
              <Input.Password />
            </Form.Item>
            {passwordValue && (
              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            )}
            <Form.Item>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={loading}
                block
              >
                {passwordValue ? "Create User" : "Create & Get Invite Link"}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
};
