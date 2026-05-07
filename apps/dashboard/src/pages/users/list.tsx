import { useEffect, useState } from "react";
import { Button, Popconfirm, Space, Table, Tag, message } from "antd";
import { authClient } from "../../auth-client";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  createdAt: Date | string;
};

export const UsersList = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const load = async () => {
    setLoading(true);
    const { data, error } = await authClient.admin.listUsers({ query: { limit: 100 } });
    setLoading(false);
    if (error) {
      messageApi.error(error.message ?? "Failed to load users");
      return;
    }
    setUsers((data?.users ?? []) as AdminUser[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSetRole = async (userId: string, role: "admin" | "user") => {
    const { error } = await authClient.admin.setRole({ userId, role });
    if (error) {
      messageApi.error(error.message ?? "Failed to set role");
      return;
    }
    messageApi.success(`Role set to ${role}`);
    void load();
  };

  const handleBan = async (userId: string) => {
    const { error } = await authClient.admin.banUser({ userId });
    if (error) {
      messageApi.error(error.message ?? "Failed to ban user");
      return;
    }
    messageApi.success("User banned");
    void load();
  };

  const handleUnban = async (userId: string) => {
    const { error } = await authClient.admin.unbanUser({ userId });
    if (error) {
      messageApi.error(error.message ?? "Failed to unban user");
      return;
    }
    messageApi.success("User unbanned");
    void load();
  };

  return (
    <>
      {contextHolder}
      <Table<AdminUser>
        rowKey="id"
        dataSource={users}
        loading={loading}
        pagination={{ pageSize: 20 }}
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
              banned ? <Tag color="red">banned</Tag> : <Tag color="green">active</Tag>,
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
              </Space>
            ),
          },
        ]}
      />
    </>
  );
};
