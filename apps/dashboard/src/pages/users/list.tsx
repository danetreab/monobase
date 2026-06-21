import { Button, Popconfirm, Space, Table, Tag, message } from "antd";
import { useList, useInvalidate } from "@refinedev/core";
import axios from "axios";
import gql from "graphql-tag";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { authClient } from "../../auth-client";

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

const GENERATE_INVITE_MUTATION = `
  mutation GenerateUserInvite($userId: ID!) {
    generateUserInvite(userId: $userId) {
      token
    }
  }
`;

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  createdAt: string;
};

const USERS_LIST_QUERY = gql`
  query UsersList(
    $filter: UserFilter
    $paging: OffsetPaging
    $sorting: [UserSort!]
  ) {
    users(filter: $filter, paging: $paging, sorting: $sorting) {
      nodes {
        id
        name
        email
        role
        banned
        createdAt
      }
      totalCount
    }
  }
`;

export const UsersList = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const invalidate = useInvalidate();

  const { result, query } = useList<AdminUser>({
    resource: "users",
    pagination: { pageSize: 20 },
    sorters: [{ field: "createdAt", order: "desc" }],
    meta: { gqlQuery: USERS_LIST_QUERY },
  });

  const handleSetRole = async (userId: string, role: "admin" | "user") => {
    const { error } = await authClient.admin.setRole({ userId, role });
    if (error) {
      messageApi.error(error.message ?? "Failed to set role");
      return;
    }
    messageApi.success(`Role set to ${role}`);
    void query.refetch();
  };

  const handleBan = async (userId: string) => {
    const { error } = await authClient.admin.banUser({ userId });
    if (error) {
      messageApi.error(error.message ?? "Failed to ban user");
      return;
    }
    messageApi.success("User banned");
    void query.refetch();
  };

  const handleUnban = async (userId: string) => {
    const { error } = await authClient.admin.unbanUser({ userId });
    if (error) {
      messageApi.error(error.message ?? "Failed to unban user");
      return;
    }
    messageApi.success("User unbanned");
    void query.refetch();
  };

  const handleRegenerateInvite = async (userId: string) => {
    try {
      const result = await gqlFetch<{
        generateUserInvite: { token: string };
      }>(GENERATE_INVITE_MUTATION, { userId });
      const url = `${window.location.origin}/accept-invite?token=${result.generateUserInvite.token}`;
      await navigator.clipboard.writeText(url);
      messageApi.success("Invite link copied to clipboard");
      await invalidate({ resource: "users", invalidates: ["list"] });
    } catch {
      messageApi.error("Failed to generate invite link");
    }
  };

  return (
    <>
      {contextHolder}

      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <Button type="primary" onClick={() => navigate("/users/create")}>
          Create User
        </Button>
      </div>

      <Table<AdminUser>
        rowKey="id"
        dataSource={(result?.data ?? []) as AdminUser[]}
        loading={query.isLoading}
        pagination={{ pageSize: 20, total: result?.total ?? 0 }}
        columns={[
          { title: "Name", dataIndex: "name" },
          { title: "Email", dataIndex: "email" },
          {
            title: "Role",
            dataIndex: "role",
            render: (role: string | null) =>
              role === "admin" ? <Tag color="gold">admin</Tag> : <Tag>user</Tag>,
          },
          {
            title: "Status",
            dataIndex: "banned",
            render: (banned: boolean | null) =>
              banned ? (
                <Tag color="red">banned</Tag>
              ) : (
                <Tag color="green">active</Tag>
              ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space>
                {record.role === "admin" ? (
                  <Button size="small" onClick={() => handleSetRole(record.id, "user")}>
                    Demote
                  </Button>
                ) : (
                  <Button size="small" onClick={() => handleSetRole(record.id, "admin")}>
                    Promote
                  </Button>
                )}
                {record.banned ? (
                  <Button size="small" onClick={() => handleUnban(record.id)}>
                    Unban
                  </Button>
                ) : (
                  <Popconfirm title="Ban this user?" onConfirm={() => handleBan(record.id)}>
                    <Button size="small" danger>
                      Ban
                    </Button>
                  </Popconfirm>
                )}
                <Button size="small" onClick={() => handleRegenerateInvite(record.id)}>
                  Invite Link
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <Outlet />
    </>
  );
};
