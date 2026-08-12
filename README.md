# Debt Buddy

Xây dựng web quản lý công nợ nội bộ

Xây dựng một web app mobile-first, dùng chủ yếu trên điện thoại để quản lý công nợ.

Ứng dụng có:

Đăng nhập Google

Kiểm soát người dùng được phép truy cập

Firebase làm backend/database

Local Storage làm cache dữ liệu để tăng tốc UI

Quản lý người

Quản lý công nợ

Ghi nhận khoản nợ và thanh toán

Chỉnh sửa trực tiếp dữ liệu

Lịch sử giao dịch

Audit log cho mọi thay đổi quan trọng

Không xây dựng hệ thống notification.

1. Công nghệ

Sử dụng:

React

TypeScript

Firebase Authentication

Google OAuth

Cloud Firestore

Firebase Security Rules

Local Storage cho cache phía client

Không dùng mock backend cho phiên bản cuối.

Tách riêng:

Authentication service

Authorization service

Firestore service

Local cache service

Debt service

Transaction service

User service

2. Đăng nhập và quyền truy cập

Người dùng đăng nhập bằng Google.

Đăng nhập thành công không có nghĩa là được truy cập ứng dụng.

Sau khi đăng nhập:

Lấy Google account.

Tìm user tương ứng trong Firestore.

Kiểm tra status.

Có:

PENDING

ACTIVE

BLOCKED

ACTIVE

Cho phép truy cập.

PENDING

Hiển thị:

Tài khoản chưa được cấp quyền

Không cho truy cập dữ liệu công nợ.

BLOCKED

Hiển thị:

Tài khoản đã bị khóa

Không cho truy cập dữ liệu.

3. Role

Có:

ADMIN

USER

ADMIN có quyền:

Quản lý người dùng

Cấp quyền

Khóa/mở khóa user

Thay đổi role

Quản lý công nợ

USER có quyền:

Xem công nợ

Thêm giao dịch

Sửa giao dịch

Ghi nhận thanh toán

USER không được quản lý người dùng.

Firebase Security Rules phải kiểm tra quyền thực tế.

Không chỉ ẩn UI bằng frontend.

4. Cấu trúc dữ liệu Firestore

users

users/{userId}


Fields:

googleUid
email
name
avatar
role
status
createdAt
updatedAt


people

Danh sách những người có quan hệ công nợ.

people/{personId}


Fields:

name
phone
address
note
createdAt
updatedAt
createdBy


transactions

Mỗi thay đổi công nợ là một transaction.

transactions/{transactionId}


Fields:

personId
type
amount
content
paymentMethod
transactionDate
createdBy
createdAt
updatedAt


5. Phân loại giao dịch

Không dùng một trường debt đơn giản gây nhầm lẫn.

Hệ thống phải phân biệt rõ hướng công nợ và hướng thanh toán.

Có 4 loại chính:

1. Mình nợ người ta

DEBT_I_OWE


Ví dụ:

Mua hàng của Nguyễn Văn A:

+500.000 ₫

Nghĩa là mình đang nợ A 500.000.

2. Người ta nợ mình

DEBT_THEY_OWE


Ví dụ:

Cho Nguyễn Văn A mua chịu:

+500.000 ₫

Nghĩa là A đang nợ mình 500.000.

3. Mình trả người ta

PAYMENT_I_PAID


Ví dụ:

Mình trả A:

-300.000 ₫

Khoản mình nợ A giảm 300.000.

4. Người ta trả mình

PAYMENT_THEY_PAID


Ví dụ:

A trả mình:

-300.000 ₫

Khoản A nợ mình giảm 300.000.

6. UX ghi công nợ

Đây là luồng thao tác quan trọng nhất.

Không mở một form dài ngay từ đầu.

Khi người dùng bấm:

+ Giao dịch

Mở màn hình/bottom sheet rất đơn giản:

Bước 1: Tìm người

Input lớn:

Nhập tên người...

Khi người dùng gõ:

Nguyễn

Lập tức tìm trong danh sách people.

Hiển thị kết quả ngay bên dưới:

Nguyễn Văn A
Còn nợ mình: 1.500.000 ₫

Nguyễn Văn B
Mình đang nợ: 700.000 ₫


Không yêu cầu bấm nút Search.

Tìm kiếm theo:

Tên

Số điện thoại

7. Người chưa tồn tại

Nếu không tìm thấy:

Hiển thị ngay bên dưới:

Không tìm thấy người này

Nút:

+ Thêm người mới

Khi bấm:

Hiện form nhỏ:

Tên

Số điện thoại

Ghi chú

Tên là bắt buộc.

Sau khi tạo:

Tự động chọn người vừa tạo.

Không bắt người dùng quay lại màn hình trước.

8. Sau khi chọn người

Sau khi xác định người, chuyển sang màn hình:

Ghi nhận giao dịch

Hiển thị rõ tên người ở trên cùng.

Ví dụ:

Nguyễn Văn A

Sau đó hiển thị lựa chọn loại giao dịch bằng các nút lớn.

Tôi nợ người này

Mua hàng / phát sinh nợ

Người này nợ tôi

Bán chịu / phát sinh khoản phải thu

Tôi trả người này

Thanh toán khoản mình đang nợ

Người này trả tôi

Thu tiền khoản họ đang nợ

Không bắt người dùng hiểu mã transaction.

UI phải dùng ngôn ngữ đời thường.

9. Nhập số tiền

Sau khi chọn loại giao dịch:

Hiển thị input số tiền cực lớn.

Ví dụ:

1.500.000 ₫


Tự động format khi nhập.

Người dùng nhập:

1500000


Hiển thị:

1.500.000 ₫


Database lưu:

1500000


Không lưu chuỗi đã format.

10. Nội dung giao dịch

Có input:

Nội dung

Ví dụ:

Mua 2 bó hoa

Tiền hàng

Trả tiền hàng

Thanh toán một phần

Khách trả tiền

Có thể để trống.

11. Phương thức thanh toán

Chỉ hiển thị khi loại giao dịch là thanh toán.

Các lựa chọn:

Tiền mặt

Chuyển khoản

Khác

12. Ngày giao dịch

Mặc định:

Hôm nay

Cho phép thay đổi ngày.

13. Hiển thị số dư ngay lập tức

Sau khi chọn người, hiển thị:

Nguyễn Văn A

A đang nợ bạn
1.500.000 ₫


hoặc:

Nguyễn Văn A

Bạn đang nợ A
700.000 ₫


Sau khi nhập giao dịch, hiển thị preview:

Số dư hiện tại
1.500.000 ₫

Sau giao dịch
1.000.000 ₫


Điều này giúp người dùng phát hiện nhập nhầm trước khi lưu.

14. Ghi nhận giao dịch

Nút chính:

Lưu giao dịch

Sau khi lưu:

Ghi transaction vào Firestore.

Cập nhật local cache.

Cập nhật UI ngay lập tức.

Quay lại trang chi tiết người.

Hiển thị transaction vừa tạo ở đầu lịch sử.

Không reload toàn bộ trang.

15. Chỉnh sửa trực tiếp

Mọi transaction đều có nút hoặc gesture:

Sửa

Cho phép chỉnh:

Loại giao dịch

Số tiền

Nội dung

Phương thức thanh toán

Ngày giao dịch

UX phải đơn giản.

Không bắt người dùng xóa transaction rồi tạo lại.

16. Audit lịch sử chỉnh sửa

Đây là yêu cầu bắt buộc.

Không được sửa transaction mà mất dấu lịch sử.

Ví dụ transaction ban đầu:

Nguyễn Văn A
Mình nợ người này
500.000 ₫

Mua hàng


Người dùng sửa thành:

1.500.000 ₫


Hệ thống phải lưu lại lịch sử thay đổi.

Ví dụ trong lịch sử:

Đã chỉnh sửa giao dịch

Số tiền:
500.000 ₫ → 1.500.000 ₫

Nội dung:
Mua hàng → Mua 3 bó hoa

Người sửa:
Nguyễn Văn B

Thời gian:
12/08/2026 21:30


17. Transaction history

Lịch sử của mỗi người phải hiển thị theo timeline.

Ví dụ:

12/08/2026

Mua 3 bó hoa
+1.500.000 ₫

Số dư: 2.000.000 ₫


Sau đó:

13/08/2026

Người này trả tiền
-500.000 ₫

Số dư: 1.500.000 ₫


Nếu transaction được chỉnh sửa:

13/08/2026

✎ Đã chỉnh sửa giao dịch

Số tiền:
1.000.000 ₫ → 1.500.000 ₫

Bởi Nguyễn Văn B


18. Không xóa lịch sử

Khi chỉnh sửa transaction:

Không được âm thầm ghi đè dữ liệu cũ mà không lưu phiên bản trước.

Có thể sử dụng:

transactions/{transactionId}/history/{historyId}


History lưu:

transactionId
changedBy
changedAt
changes
previousData
newData


Mọi thay đổi quan trọng phải có audit trail.

19. Xóa transaction

Không xóa vĩnh viễn ngay lập tức.

Khi chọn xóa:

Hiển thị confirmation:

Xóa giao dịch này?

Sau khi xác nhận:

Đánh dấu transaction là deleted/reverted.

Ghi audit history.

Không làm mất lịch sử.

Ví dụ:

Đã hủy giao dịch

-500.000 ₫

Người thực hiện:
Nguyễn Văn B

12/08/2026 21:35


Số dư được tính lại chính xác.

20. Local Storage cache

Sử dụng Local Storage để cache dữ liệu cần thiết cho UI.

Mục tiêu:

Mở app → giao diện xuất hiện gần như ngay lập tức → dữ liệu Firestore cập nhật phía sau.

Lưu cache:

people

recent transactions

user profile

một số summary data

Luồng:

App mở
↓
Đọc local cache
↓
Render UI ngay
↓
Kết nối Firebase
↓
Đồng bộ dữ liệu mới
↓
Cập nhật UI
↓
Cập nhật Local Storage


Không coi Local Storage là nguồn dữ liệu chính.

Firestore mới là source of truth.

Không lưu thông tin bảo mật hoặc quyền admin vào Local Storage để dùng làm cơ chế authorization.

21. Đồng bộ dữ liệu

Khi Firestore có dữ liệu mới:

Cập nhật UI realtime.

Cập nhật cache.

Nếu dữ liệu local cũ hơn server:

Ưu tiên dữ liệu server.

Cập nhật cache.

Nếu có lỗi mạng:

Cho phép xem dữ liệu cache.

Hiển thị trạng thái:

Đang offline

Không giả vờ rằng dữ liệu đã đồng bộ.

22. Dashboard

Hiển thị:

Tôi đang nợ

Tổng tiền mình phải trả.

Người khác đang nợ tôi

Tổng tiền phải thu.

Giao dịch gần đây

Hiển thị các transaction mới nhất.

Công nợ cần chú ý

Các khoản lớn hoặc quá hạn.

23. Danh sách công nợ

Mỗi người hiển thị:

Nguyễn Văn A

Người này nợ bạn
1.500.000 ₫

Giao dịch gần nhất:
12/08/2026


Hoặc:

Nguyễn Văn B

Bạn đang nợ người này
700.000 ₫


Màu sắc phải giúp phân biệt hai trạng thái nhưng không lạm dụng màu.

24. Tìm kiếm

Thanh tìm kiếm trên danh sách công nợ.

Tìm realtime theo:

Tên

Số điện thoại

Kết quả phải xuất hiện ngay khi gõ.

25. Mobile UX

Ưu tiên thao tác một tay.

Luồng phổ biến:

+ Giao dịch
↓
Nhập tên
↓
Chọn người
↓
Chọn loại
↓
Nhập tiền
↓
Lưu


Cố gắng hoàn thành trong 3-5 thao tác chính.

Không mở những form dài với 10 trường ngay từ đầu.

26. Hiệu suất

Ưu tiên:

Render nhanh từ Local Storage.

Firestore realtime listener cho dữ liệu quan trọng.

Debounce search nếu cần.

Không tải toàn bộ lịch sử giao dịch nếu không cần.

Pagination hoặc infinite scroll cho lịch sử lớn.

Chỉ tải dữ liệu cần thiết.

Không query Firestore lặp lại vô ích.

Cache kết quả tìm kiếm phù hợp.

27. Firebase Security

Bắt buộc sử dụng Firebase Security Rules.

Không tin tưởng:

role từ client

status từ client

userId từ client

Kiểm tra quyền bằng Firebase Authentication + Firestore Security Rules.

ADMIN mới được:

sửa role

thay đổi status

quản lý user

USER không được truy cập collection quản trị.

28. Giao diện tổng thể

Phong cách:

Mobile-first

Clean

Minimal

Tối ưu tốc độ

Ít card

Không màu mè

Typography rõ ràng

Số tiền là thông tin nổi bật nhất

Bottom navigation:

Tổng quan | Công nợ | Giao dịch | Khác

ADMIN có thêm:

Người dùng

29. Không xây dựng

Không cần:

Notification

Push notification

Email reminder

Chat

Social features

Hệ thống bạn bè

Những dashboard phức tạp không phục vụ công nợ

Tập trung vào:

Tìm người → ghi giao dịch → xem số dư → thu/trả → lịch sử → chỉnh sửa có audit.

Hãy ưu tiên UX của thao tác ghi công nợ hơn các màn hình thống kê đẹp mắt nhưng ít dùng.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e96870b5-046b-45e6-84cc-84b86e37e345).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
