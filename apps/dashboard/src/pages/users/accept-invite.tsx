import { Button, Card, Form, Input, Result, Spin, Typography, message } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const gqlFetch = async <T,>(query: string, variables: Record<string, unknown>): Promise<T> => {
  const { data } = await axios.post<{ data?: T; errors?: { message: string }[] }>(
    `${baseUrl}/graphql/v1`,
    { query, variables },
  );
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data as T;
};

const INVITE_QUERY = `
  query UserInviteByToken($token: String!) {
    userInviteByToken(token: $token) {
      userId
      name
      email
      expiresAt
    }
  }
`;

const ACCEPT_INVITE_MUTATION = `
  mutation AcceptUserInvite($input: AcceptInviteInput!) {
    acceptUserInvite(input: $input)
  }
`;

type InviteInfo = {
  userId: string;
  name: string;
  email: string;
  expiresAt: string;
};

export const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invite token provided.");
      setLoading(false);
      return;
    }
    gqlFetch<{ userInviteByToken: InviteInfo }>(INVITE_QUERY, { token })
      .then(({ userInviteByToken }) => setInvite(userInviteByToken))
      .catch(() => setError("This invite link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (values: { password: string }) => {
    setSubmitting(true);
    try {
      await gqlFetch(ACCEPT_INVITE_MUTATION, { input: { token, password: values.password } });
      setDone(true);
    } catch (err: unknown) {
      messageApi.error((err as Error).message ?? "Failed to accept invite");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Result
          status="success"
          title="Password set successfully"
          subTitle="Your account is now active. You can log in."
          extra={
            <Button type="primary" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          }
        />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Result
          status="error"
          title="Invalid Invite"
          subTitle={error ?? "This invite link is no longer valid."}
          extra={<Button onClick={() => navigate("/login")}>Go to Login</Button>}
        />
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f0f2f5",
        }}
      >
        <Card style={{ width: 400 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Set your password
          </Typography.Title>
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
            Welcome, {invite.name}. Set a password for{" "}
            <strong>{invite.email}</strong> to activate your account.
          </Typography.Text>
          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirm"
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
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>
                Activate Account
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
};
