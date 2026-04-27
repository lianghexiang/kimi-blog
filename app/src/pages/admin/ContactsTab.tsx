import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users } from "lucide-react";

export default function ContactsTab() {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts", "list"],
    queryFn: () => api.contacts.list(),
  });

  return (
    <div>
      <div className="bg-white rounded-2xl neo-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    姓名
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  邮箱
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  留言
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  时间
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : contacts && contacts.length > 0 ? (
                contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {contact.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {contact.message}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono-type">
                      {new Date(contact.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 text-gray-400"
                  >
                    暂无留言
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
