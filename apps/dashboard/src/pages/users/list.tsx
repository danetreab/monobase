import { Button, Popconfirm, Space, Table, Tag, message } from "antd";
import { useInvalidate } from "@refinedev/core";
import { Breadcrumb, List, useTable } from "@refinedev/antd";
import axios from "axios";
import gql from "graphql-tag";
import { Outlet } from "react-router-dom";
import { authClient } from "../../auth-client";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const gqlFetch = async <T,>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> => {
  const { data } = await axios.post<{
    data?: T;
    errors?: { message: string }[];
  }>(`${baseUrl}/graphql/v1`, { query, variables }, { withCredentials: true });
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
  const invalidate = useInvalidate();

  const { tableProps } = useTable<AdminUser>({
    resource: "users",
    syncWithLocation: true,
    pagination: { pageSize: 20 },
    sorters: { initial: [{ field: "createdAt", order: "desc" }] },
    meta: { gqlQuery: USERS_LIST_QUERY },
  });

  const refresh = () =>
    invalidate({ resource: "users", invalidates: ["list"] });

  const handleSetRole = async (userId: string, role: "admin" | "user") => {
    const { error } = await authClient.admin.setRole({ userId, role });
    if (error) {
      messageApi.error(error.message ?? "Failed to set role");
      return;
    }
    messageApi.success(`Role set to ${role}`);
    void refresh();
  };

  const handleBan = async (userId: string) => {
    const { error } = await authClient.admin.banUser({ userId });
    if (error) {
      messageApi.error(error.message ?? "Failed to ban user");
      return;
    }
    messageApi.success("User banned");
    void refresh();
  };

  const handleUnban = async (userId: string) => {
    const { error } = await authClient.admin.unbanUser({ userId });
    if (error) {
      messageApi.error(error.message ?? "Failed to unban user");
      return;
    }
    messageApi.success("User unbanned");
    void refresh();
  };

  const handleRegenerateInvite = async (userId: string) => {
    try {
      const result = await gqlFetch<{
        generateUserInvite: { token: string };
      }>(GENERATE_INVITE_MUTATION, { userId });
      const url = `${window.location.origin}/accept-invite?token=${result.generateUserInvite.token}`;
      await navigator.clipboard.writeText(url);
      messageApi.success("Invite link copied to clipboard");
    } catch {
      messageApi.error("Failed to generate invite link");
    }
  };

  return (
    <>
      <List>
        <Table<AdminUser> {...tableProps} rowKey="id">
          <Table.Column title="Name" dataIndex="name" />
          <Table.Column title="Email" dataIndex="email" />
          <Table.Column<AdminUser>
            title="Role"
            dataIndex="role"
            render={(role: string | null) =>
              role === "admin" ? <Tag color="gold">admin</Tag> : <Tag>user</Tag>
            }
          />
          <Table.Column<AdminUser>
            title="Status"
            dataIndex="banned"
            render={(banned: boolean | null) =>
              banned ? (
                <Tag color="red">banned</Tag>
              ) : (
                <Tag color="green">active</Tag>
              )
            }
          />
          <Table.Column<AdminUser>
            title="Actions"
            key="actions"
            render={(_, record) => (
              <Space>
                {record.role === "admin" ? (
                  <Button
                    size="small"
                    onClick={() => handleSetRole(record.id, "user")}
                  >
                    Demote
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={() => handleSetRole(record.id, "admin")}
                  >
                    Promote
                  </Button>
                )}
                {record.banned ? (
                  <Button size="small" onClick={() => handleUnban(record.id)}>
                    Unban
                  </Button>
                ) : (
                  <Popconfirm
                    title="Ban this user?"
                    onConfirm={() => handleBan(record.id)}
                  >
                    <Button size="small" danger>
                      Ban
                    </Button>
                  </Popconfirm>
                )}
                <Button
                  size="small"
                  onClick={() => handleRegenerateInvite(record.id)}
                >
                  Invite Link
                </Button>
              </Space>
            )}
          />
        </Table>
      </List>
      <Outlet />
    </>
  );
};
