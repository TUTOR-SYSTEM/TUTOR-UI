"use client";

import { SwitchRow } from "@/components/ui/switch-row.ui";
import { SectionHeading } from "@/components/ui/section-heading.ui";
import { Separator } from "@/components/ui/separator.ui";
import { SaveButton } from "@/components/settings/settings-save-button";

export function NotificationsPanel() {
  return (
    <div className="flex flex-col gap-2">
      <SectionHeading>Kênh thông báo</SectionHeading>
      <div className="rounded-lg border border-border-light divide-y divide-border-light px-4">
        <SwitchRow
          defaultChecked
          label="Thông báo trong ứng dụng"
          desc="Hiển thị thông báo trực tiếp trên màn hình"
        />
        <SwitchRow
          defaultChecked
          label="Email"
          desc="Gửi tóm tắt thông báo về email"
        />
        <SwitchRow label="SMS" desc="Nhắn tin đến số điện thoại đã đăng ký" />
      </div>

      <Separator className="my-6" />
      <SectionHeading>Loại thông báo</SectionHeading>
      <div className="rounded-lg border border-border-light divide-y divide-border-light px-4">
        <SwitchRow
          defaultChecked
          label="Học phí"
          desc="Thanh toán mới, nhắc nhở đến hạn"
        />
        <SwitchRow
          defaultChecked
          label="Học sinh"
          desc="Nghỉ học, kết quả kiểm tra"
        />
        <SwitchRow
          defaultChecked
          label="Lịch học"
          desc="Thay đổi lịch, buổi học sắp tới"
        />
        <SwitchRow label="Gia sư" desc="Cập nhật chương trình, nhắc nhở nội bộ" />
        <SwitchRow
          defaultChecked
          label="Hệ thống"
          desc="Bảo trì, cập nhật tính năng"
        />
      </div>

      <Separator className="my-6" />
      <SectionHeading>Lịch nhận thông báo</SectionHeading>
      <div className="rounded-lg border border-border-light divide-y divide-border-light px-4">
        <SwitchRow
          defaultChecked
          label="Nhắc lịch trước 30 phút"
          desc="Thông báo trước mỗi buổi dạy"
        />
        <SwitchRow label="Tóm tắt cuối ngày" desc="Gửi lúc 21:00 mỗi ngày" />
        <SwitchRow
          defaultChecked
          label="Tóm tắt cuối tuần"
          desc="Gửi sáng Chủ nhật hàng tuần"
        />
      </div>

      <SaveButton />
    </div>
  );
}
