import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PermissionsTab() {
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["permissions", "list"],
    queryFn: () => api.roles.permissions(),
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl neo-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  权限名称
                </div>
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                资源
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                操作
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                描述
              </th>
            </tr>
          </thead>
          <tbody>
            {permissions && permissions.length > 0 ? (
              permissions.map((perm) => (
                <tr
                  key={perm.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    <Badge variant="outline" className="font-mono">
                      {perm.name}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {perm.resource}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {perm.action}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {perm.description || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-8 text-gray-400"
                >
                  暂无权限数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
