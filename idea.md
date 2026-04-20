ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP
Tên đề tài đề xuất
Thiết kế và xây dựng nền tảng web hỗ trợ tổ chức, chấm thi và ôn luyện cho Olympic Trí tuệ Nhân tạo
Sinh viên Việt Nam
Tên tiếng Anh đề xuất
Design and Development of a Web-Based Platform for AI Contest Management, Automated
Evaluation, and Practice for the Vietnam Student Artificial Intelligence Olympiad

1. Tổng quan đề tài
1.1. Bối cảnh
Các cuộc thi về Trí tuệ Nhân tạo dành cho sinh viên ngày càng xuất hiện nhiều hơn và có xu hướng phức tạp
hơn so với các kỳ thi lập trình truyền thống. Trong một cuộc thi AI, thí sinh không chỉ nộp mã nguồn mà còn
có thể nộp file dự đoán, ảnh đầu ra, mô hình học máy, checkpoint, script suy luận và nhiều loại hiện vật
khác. Việc chấm thi cũng không dừng ở so sánh output đơn giản, mà phải hỗ trợ nhiều loại độ đo như
Accuracy, F1-score, BLEU, Cosine Similarity, PSNR, hoặc các hàm điểm tổng hợp do ban tổ chức định nghĩa.
Olympic Trí tuệ Nhân tạo Sinh viên Việt Nam là một ví dụ tiêu biểu cho loại cuộc thi này. Đề thi có thể gồm
nhiều tác vụ, nhiều giai đoạn, nhiều hình thức nộp bài và nhiều cách chấm khác nhau. Đồng thời, trong quá
trình thi còn cần có bảng xếp hạng, cơ chế giới hạn số lần nộp, hệ thống giải đáp thắc mắc giữa thí sinh và
ban tổ chức, cũng như khả năng hậu kiểm để bảo đảm tính công bằng.
Hiện nay, nhiều nền tảng thi trực tuyến phổ biến chủ yếu phục vụ bài toán lập trình hoặc một kiểu cuộc thi
AI riêng lẻ, chưa thật sự tối ưu cho bối cảnh tổ chức và ôn luyện một cuộc thi AI sinh viên nhiều giai đoạn tại
trường đại học. Vì vậy, việc xây dựng một nền tảng web chuyên biệt, có thể phục vụ cả huấn luyện lẫn tổ
chức thi thật, là một hướng có giá trị thực tiễn và học thuật.
1.2. Lý do chọn đề tài
Đề tài được lựa chọn vì các lý do sau:
Có nhu cầu thực tế rõ ràng trong việc hỗ trợ ôn luyện và tổ chức thi AI tại trường.
Phù hợp với xu hướng phát triển các nền tảng đánh giá tự động cho bài toán AI.
Có độ khó kỹ thuật đủ lớn để đáp ứng yêu cầu của đồ án tốt nghiệp.
Có khả năng triển khai thành sản phẩm dùng thử thực tế thay vì chỉ dừng ở mức mô phỏng.
Cho phép kết hợp kiến thức về phát triển web, hệ thống phân tán, cơ sở dữ liệu, bảo mật, chấm thi
tự động và học máy.
•
•
•
•
•

1

Có thể phát triển tiếp thành nền tảng lâu dài cho câu lạc bộ, khoa, trường hoặc các kỳ thi tương tự.
1.3. Tính cấp thiết
Trong thực tế tổ chức thi AI, ban tổ chức thường gặp các vấn đề:
Khó quản lý nhiều vòng thi, nhiều phase và nhiều loại bài nộp.
Chưa có công cụ linh hoạt để định nghĩa luật chấm riêng cho từng bài.
Việc trao đổi giữa thí sinh và ban tổ chức dễ phân tán, thiếu kiểm soát và khó lưu vết.
Hậu kiểm, chấm lại, khóa mô hình, xác minh tái lập kết quả còn thủ công.
Việc tổ chức luyện tập cho sinh viên thường rời rạc, thiếu một cổng tập trung.
Do đó, một hệ thống tích hợp quản lý contest, nộp bài, chấm thi, bảng xếp hạng, tương tác trong lúc thi và
hậu kiểm là cần thiết.

2. Mục tiêu đề tài
2.1. Mục tiêu tổng quát
Xây dựng một nền tảng web cho phép tổ chức, quản lý, chấm thi tự động và hỗ trợ ôn luyện cho các cuộc thi
AI theo mô hình nhiều tác vụ, nhiều phase, nhiều kiểu bài nộp và nhiều độ đo đánh giá khác nhau.
2.2. Mục tiêu cụ thể
Hệ thống cần đạt được các mục tiêu cụ thể sau:
Xây dựng cổng người dùng cho thí sinh, đội thi và ban tổ chức.
Hỗ trợ tạo contest, task, phase và cấu hình luật thi.
Hỗ trợ thí sinh nộp các loại bài nộp khác nhau như file dự đoán, file văn bản, file CSV, ảnh, zip, source
code, checkpoint và script suy luận.
Xây dựng cơ chế kiểm tra cấu trúc bài nộp trước khi chấm.
Thiết kế lõi chấm thi tự động có thể mở rộng theo nhiều độ đo và nhiều loại tác vụ.
Hỗ trợ bảng xếp hạng public/private, quy tắc chọn bài tốt nhất hoặc bài cuối cùng, và chuẩn hóa
điểm hiển thị.
Hỗ trợ kênh tương tác trong lúc thi gồm thông báo, clarification và báo lỗi kỹ thuật.
Cho phép ban tổ chức chấm lại bài nộp, hậu kiểm và theo dõi toàn bộ quá trình chấm.
Đảm bảo các yêu cầu phi chức năng quan trọng như phân quyền, bảo mật file nộp, log hệ thống và
khả năng mở rộng.
Tạo một nguyên mẫu có thể dùng để ôn luyện và tổ chức các kỳ thi AI trong phạm vi trường đại học.
•

•
•
•
•
•

1.
2.
3.
4.
5.
6.
7.
8.
9.
10.

2

3. Đối tượng, phạm vi và giới hạn nghiên cứu
3.1. Đối tượng nghiên cứu
Các bài toán và quy trình tổ chức cuộc thi AI.
Các phương pháp chấm thi tự động cho bài toán AI.
Kiến trúc phần mềm cho hệ thống contest-based web platform.
Cơ chế quản lý submission, evaluation pipeline và leaderboard.
Mô hình tương tác giữa thí sinh và ban tổ chức trong môi trường thi trực tuyến.
3.2. Phạm vi thực hiện
Trong phạm vi đồ án, hệ thống tập trung vào:
Cuộc thi AI cấp trường hoặc mô phỏng một contest theo tinh thần Olympic Trí tuệ Nhân tạo Sinh
viên.
Người dùng chính gồm thí sinh, đội thi, ban tổ chức, giám khảo và quản trị viên.
Các bài nộp thuộc hai nhóm chính:
Nộp output để chấm trực tiếp.
Nộp source/model để hậu kiểm hoặc tái lập kết quả.
Các loại metric tiêu biểu như Accuracy, F1-score, BLEU, Cosine Similarity, PSNR và metric tổng hợp.
Hệ thống web triển khai nội bộ hoặc trên máy chủ thí nghiệm.
3.3. Những gì không nằm trong phạm vi chính
Để giữ đề tài khả thi trong khuôn khổ đồ án tốt nghiệp, hệ thống không đặt trọng tâm vào:
Xây dựng môi trường code trực tuyến hoàn chỉnh như IDE hoặc notebook online.
Huấn luyện mô hình AI trên server cho thí sinh theo thời gian thực.
Tối ưu quy mô lớn như hàng chục nghìn người dùng đồng thời.
Hỗ trợ mọi loại contest trên thế giới; hệ thống ưu tiên phù hợp với bối cảnh AI contest sinh viên.
3.4. Giới hạn
Hệ thống được xây dựng dưới dạng nguyên mẫu có thể triển khai và sử dụng thực tế ở quy mô vừa.
Chức năng code-based judging và chạy lại mô hình có thể được triển khai ở mức cơ bản hoặc ở giai
đoạn nâng cao, tùy tiến độ.
Dữ liệu thi thật có thể được mô phỏng hoặc sử dụng bộ dữ liệu mẫu để chứng minh quy trình.

4. Bài toán cần giải quyết
Bài toán trọng tâm của đề tài là:
•
•
•
•
•

•
•
•
•
•
•
•

•
•
•
•

•
•
•

3

Làm thế nào để thiết kế và xây dựng một nền tảng web có thể hỗ trợ đầy đủ quy trình thi AI, từ khâu
quản lý cuộc thi, nộp bài, chấm tự động, hiển thị bảng xếp hạng, tương tác với ban tổ chức cho đến
hậu kiểm, trong khi vẫn đảm bảo tính linh hoạt, công bằng, dễ mở rộng và phù hợp với môi trường
đại học?
Bài toán này được chia thành các bài toán con:
Làm thế nào để mô hình hóa contest AI nhiều phase trên hệ thống.
Làm thế nào để hỗ trợ nhiều kiểu bài nộp khác nhau.
Làm thế nào để chấm tự động cho nhiều metric và nhiều task khác nhau.
Làm thế nào để xây dựng bảng xếp hạng phù hợp với luật thi.
Làm thế nào để ban tổ chức vận hành contest hiệu quả.
Làm thế nào để bảo đảm tính minh bạch, khả năng chấm lại và hậu kiểm.

5. Câu hỏi nghiên cứu / câu hỏi thiết kế
Một cuộc thi AI có thể được mô hình hóa trên hệ thống web theo cấu trúc nào để vừa rõ ràng vừa dễ
mở rộng?
Cần thiết kế submission schema ra sao để hỗ trợ nhiều dạng bài nộp mà vẫn kiểm tra được tính hợp
lệ?
Nên tổ chức lõi chấm thi theo pipeline nào để tách biệt kiểm tra bài nộp, thực thi, tính metric và cập
nhật leaderboard?
Làm thế nào để hỗ trợ đồng thời output-based judging và code-based rerun/hậu kiểm?
Hệ thống leaderboard cần lưu những mức điểm nào để thích ứng với nhiều luật chấm và nhiều cách
hiển thị?
Những cơ chế tương tác nào là cần thiết giữa thí sinh và ban tổ chức trong khi thi?
Làm thế nào để bảo đảm truy vết, audit log và khả năng rejudge trong contest AI?

6. Ý nghĩa khoa học và thực tiễn
6.1. Ý nghĩa khoa học
Đề xuất mô hình kiến trúc cho nền tảng thi AI nhiều phase.
Xây dựng cách tiếp cận chấm thi linh hoạt theo plugin metric.
Phân tách bài toán chấm thi AI thành các lớp xử lý: validation, execution, scoring, leaderboard.
Bổ sung góc nhìn thiết kế hệ thống cho lĩnh vực tổ chức cuộc thi AI ở môi trường giáo dục.
6.2. Ý nghĩa thực tiễn
Có thể sử dụng ngay để ôn luyện tại trường.
Giảm tải cho ban tổ chức trong việc nhận bài, chấm bài và cập nhật bảng xếp hạng.
Chuẩn hóa quy trình tổ chức một kỳ thi AI.
1.
2.
3.
4.
5.
6.

1.
2.
3.
4.
5.
6.
7.

•
•
•
•

•
•
•

4

Tạo nền tảng để mở rộng cho các cuộc thi hoặc khóa học thực hành AI khác.

7. Phân tích yêu cầu hệ thống
7.1. Tác nhân sử dụng hệ thống
Hệ thống có các tác nhân chính sau:
7.1.1. Thí sinh
Xem contest, task, luật thi.
Nộp bài.
Theo dõi trạng thái chấm.
Xem lịch sử bài nộp.
Xem leaderboard.
Gửi câu hỏi cho ban tổ chức.
7.1.2. Đội trưởng / đại diện đội
Quản lý thành viên đội.
Thực hiện nộp bài thay mặt đội.
Theo dõi các trao đổi liên quan đến đội.
7.1.3. Ban tổ chức / jury
Tạo contest, task, phase.
Quản lý dữ liệu, file mẫu, metric.
Trả lời clarification.
Theo dõi queue chấm.
Rejudge và hậu kiểm.
7.1.4. Quản trị viên
Quản lý người dùng và phân quyền.
Quản lý hạ tầng và cấu hình hệ thống.
Theo dõi log, sức khỏe hệ thống.
7.1.5. Worker chấm thi
Nhận job từ hàng đợi.
Kiểm tra bài nộp.
Thực thi pipeline chấm.
Trả kết quả về hệ thống.
•

•
•
•
•
•
•

•
•
•

•
•
•
•
•

•
•
•

•
•
•
•

5

7.2. Yêu cầu chức năng
7.2.1. Quản lý người dùng và đội thi
Đăng ký, đăng nhập, đăng xuất.
Quản lý hồ sơ người dùng.
Tạo đội, mời thành viên, rời đội.
Phân quyền đội trưởng và thành viên.
Khóa đội theo quy định cuộc thi.
7.2.2. Quản lý cuộc thi
Tạo contest mới.
Khai báo thời gian bắt đầu, kết thúc.
Định nghĩa nhiều task trong contest.
Định nghĩa nhiều phase cho mỗi task.
Cấu hình luật thi, số lần nộp và kiểu leaderboard.
7.2.3. Quản lý đề bài và dữ liệu
Tải lên mô tả đề bài.
Tải lên file dữ liệu public.
Tải lên sample submission.
Tải lên baseline hoặc starter kit.
Gắn evaluator/metric tương ứng với task.
7.2.4. Nộp bài
Chọn task và phase để nộp.
Upload bài nộp.
Kiểm tra định dạng sơ bộ trước khi xác nhận.
Hiển thị số lần nộp còn lại.
Ghi nhận thời gian nộp và metadata.
7.2.5. Kiểm tra bài nộp
Kiểm tra loại file.
Kiểm tra cấu trúc thư mục hoặc zip.
Kiểm tra các file bắt buộc.
Kiểm tra tên file, số dòng, encoding hoặc schema dữ liệu.
Tạo manifest và hash bài nộp.
7.2.6. Chấm thi tự động
Hỗ trợ đọc output để chấm trực tiếp.
Hỗ trợ thực thi source/model trong môi trường cô lập.
Tính score theo metric đã cấu hình.
Lưu raw score và metadata quá trình chấm.
Trả trạng thái hoàn tất hoặc lỗi.
•
•
•
•
•

•
•
•
•
•

•
•
•
•
•

•
•
•
•
•

•
•
•
•
•

•
•
•
•
•

6

7.2.7. Bảng xếp hạng
Hiển thị bảng xếp hạng theo task.
Hiển thị bảng xếp hạng tổng.
Hỗ trợ best submission hoặc latest submission.
Hỗ trợ public/private leaderboard.
Hỗ trợ freeze/unfreeze.
Hỗ trợ chuẩn hóa điểm hiển thị.
7.2.8. Tương tác trong khi thi
Gửi thông báo từ ban tổ chức.
Gửi clarification từ thí sinh.
Trả lời private hoặc public.
Tạo ticket lỗi kỹ thuật.
Lưu lịch sử trao đổi.
7.2.9. Quản trị chấm thi
Theo dõi queue.
Rejudge một bài hoặc nhiều bài.
Chạy hậu kiểm final submission.
Xem log validator, executor và scorer.
Khóa/mở phase.
7.2.10. Báo cáo và thống kê
Xuất leaderboard.
Xuất danh sách submission.
Thống kê số lượt nộp.
Thống kê thời gian chấm.
Thống kê lỗi phổ biến.
7.3. Yêu cầu phi chức năng
7.3.1. Tính đúng đắn
Kết quả chấm phải nhất quán với metric đã cấu hình.
Mỗi submission phải được xử lý rõ trạng thái.
7.3.2. Tính bảo mật
Phân quyền rõ ràng giữa contestant, jury và admin.
Không để lộ test private, ground truth hay evaluator nội bộ.
Giới hạn truy cập vào artifact nhạy cảm.
7.3.3. Tính mở rộng
Dễ thêm task mới.
•
•
•
•
•
•

•
•
•
•
•

•
•
•
•
•

•
•
•
•
•

•
•

•
•
•

•

7

Dễ thêm metric mới.
Dễ thêm phase mới.
Dễ bổ sung worker CPU/GPU khi cần.
7.3.4. Tính sẵn sàng
Hệ thống có thể tiếp nhận nhiều bài nộp liên tiếp.
Nếu worker lỗi, queue vẫn không mất job.
7.3.5. Tính dễ sử dụng
Giao diện rõ ràng.
Thông báo lỗi dễ hiểu.
Quy trình nộp bài ngắn gọn.
7.3.6. Tính truy vết
Mọi thao tác của người dùng và admin đều được lưu log.
Có thể kiểm tra lịch sử chấm và lịch sử rejudge.

8. Đề xuất giải pháp tổng thể
8.1. Ý tưởng chung
Hệ thống được xây dựng như một nền tảng web gồm ba lớp chính:
Lớp giao diện và nghiệp vụ cho thí sinh, đội thi, ban tổ chức.
Lớp xử lý bài nộp và chấm thi thông qua queue và worker.
Lớp lưu trữ và quản trị gồm cơ sở dữ liệu, object storage, log và cấu hình.
Quy trình tổng quát:
Thí sinh đăng nhập và nộp bài.
Hệ thống lưu bài nộp và đưa vào queue.
Worker kiểm tra cấu trúc submission.
Nếu là output-based, hệ thống đọc output và tính metric.
Nếu là code-based, worker chạy script suy luận trong môi trường cô lập rồi chấm kết quả.
Kết quả được lưu vào DB và cập nhật leaderboard.
Ban tổ chức theo dõi quá trình chấm, trả lời clarification và rejudge khi cần.
8.2. Hướng tiếp cận kỹ thuật
Frontend web hiện đại cho trải nghiệm người dùng.
Backend API theo mô hình REST hoặc kết hợp WebSocket cho trạng thái real-time.
Job queue để tách luồng upload và luồng chấm.
Metric plugin để linh hoạt chấm nhiều loại task.
•
•
•

•
•

•
•
•

•
•

1.
2.
3.

•
•
•
•
•
•
•

•
•
•
•

8

Docker sandbox cho bài nộp cần chạy code.
Object storage cho artifact và log lớn.

9. Kiến trúc hệ thống đề xuất
9.1. Kiến trúc mức cao
Hệ thống gồm các thành phần sau:
9.1.1. Frontend
Giao diện cho thí sinh.
Giao diện cho ban tổ chức/admin.
Giao diện leaderboard.
Giao diện clarification và ticket.
9.1.2. Backend API
Xử lý xác thực và phân quyền.
Quản lý contest, task, phase, submission.
Điều phối leaderboard.
Quản lý clarification và thông báo.
9.1.3. Submission Service
Nhận file upload.
Lưu metadata submission.
Gửi job vào hàng đợi.
9.1.4. Judge Workers
Validator worker.
Executor worker.
Scorer worker.
Rejudge controller.
9.1.5. Storage Layer
PostgreSQL cho metadata.
Redis/RabbitMQ cho queue.
MinIO hoặc S3-compatible storage cho file nộp.
Log storage cho log chấm và audit.
•
•

•
•
•
•

•
•
•
•

•
•
•

•
•
•
•

•
•
•
•

9

9.2. Kiến trúc module
Module 1: Authentication & Authorization
Đăng nhập.
JWT/session.
Phân quyền theo vai trò.
Module 2: Contest Management
Quản lý contest.
Quản lý task.
Quản lý phase.
Quản lý luật thi.
Module 3: Team Management
Tạo và quản lý đội.
Cấu hình đội dự thi.
Module 4: Submission Management
Upload artifact.
Lưu submission metadata.
Theo dõi trạng thái bài nộp.
Module 5: Validation Engine
Kiểm tra schema bài nộp.
Kiểm tra file bắt buộc.
Sinh manifest.
Module 6: Execution & Scoring Engine
Output-based scoring.
Code-based execution.
Metric plugin.
Module 7: Leaderboard Engine
Cập nhật điểm.
Chuẩn hóa điểm.
Xếp hạng.
Freeze/unfreeze.
Module 8: Clarification & Ticketing
Announcement.
Clarification.
•
•
•

•
•
•
•

•
•

•
•
•

•
•
•

•
•
•

•
•
•
•

•
•

10

Technical ticket.
Audit log.
Module 9: Monitoring & Admin Tools
Theo dõi queue.
Theo dõi worker.
Rejudge.
Xem log.

10. Thiết kế chức năng chi tiết theo module
10.1. Module quản lý cuộc thi
Chức năng
Tạo/sửa/xóa contest.
Thiết lập thời gian thi.
Tạo nhiều task trong contest.
Tạo nhiều phase trong mỗi task.
Quy định thời gian mở/đóng từng phase.
Quy định số lượt nộp.
Cấu hình leaderboard visibility.
Dữ liệu cần quản lý
Tên contest.
Mô tả contest.
Quy chế contest.
Thời gian tổng thể.
Danh sách task.
Danh sách phase.
10.2. Module quản lý task
Chức năng
Khai báo loại task.
Tải lên mô tả đề.
Gắn file dữ liệu.
Gắn sample submission.
Gắn metric plugin.
Gắn submission schema.
•
•

•
•
•
•

•
•
•
•
•
•
•

•
•
•
•
•
•

•
•
•
•
•
•

11

Dữ liệu cần quản lý
Task name.
Task slug.
Problem statement.
Dataset references.
Evaluation type.
Submission type.
10.3. Module quản lý phase
Chức năng
Tạo phase public_test, final_public, private_test, final_private.
Cấu hình lượt nộp tối đa.
Bật/tắt hiển thị điểm.
Chọn rule xếp hạng.
Chọn chấm output-based hay code-based.
Cấu hình lock model/hậu kiểm.
Dữ liệu cần quản lý
Phase name.
Open/close time.
Submit limit.
Judging mode.
Leaderboard mode.
Best/latest rule.
10.4. Module submission
Chức năng
Nhận file nộp.
Ghi nhận người nộp, đội nộp, task, phase.
Ghi nhận thời gian.
Hiển thị trạng thái.
Tải lại file log nếu được phép.
Trạng thái submission đề xuất
Draft
Uploaded
Validating
Validation Failed
Queued
Running
Scoring
•
•
•
•
•
•

•
•
•
•
•
•

•
•
•
•
•
•

•
•
•
•
•

•
•
•
•
•
•
•

12

Finished
Failed
Rejudging
Archived
10.5. Module validation
Chức năng
Kiểm tra định dạng file.
Kiểm tra tên file.
Kiểm tra schema CSV/TXT/JSONL.
Kiểm tra số lượng file trong zip.
Kiểm tra số dòng/encoding.
Tạo manifest hash.
Mục tiêu
Loại bỏ các bài sai format trước khi tốn tài nguyên chấm.
Trả thông báo lỗi rõ ràng cho thí sinh.
10.6. Module execution
Output-based mode
Đọc file output của thí sinh.
Ghép với test/ground truth phía server.
Chuyển sang scorer.
Code-based mode
Giải nén package.
Khởi tạo môi trường cô lập.
Mount test data read-only.
Chạy lệnh suy luận.
Thu output.
Chuyển output sang scorer.
10.7. Module scoring
Các metric hỗ trợ ban đầu
Accuracy
Precision/Recall/F1
BLEU/SacreBLEU
Cosine Similarity
MSE/MAE/MAPE
PSNR
•
•
•
•

•
•
•
•
•
•

•
•

•
•
•

•
•
•
•
•
•

•
•
•
•
•
•

13

Weighted score
Custom aggregated score
Chức năng
Tính raw score.
Lưu metric breakdown.
Sinh display score.
Gửi kết quả cho leaderboard engine.
10.8. Module leaderboard
Chức năng
Xếp hạng theo task.
Xếp hạng tổng.
Chọn best submission hoặc latest submission.
Hỗ trợ nhiều loại tie-break.
Freeze và unfreeze bảng xếp hạng.
Lưu snapshot.
Dữ liệu nên lưu
raw_score
normalized_score
display_score
rank
chosen_submission_id
snapshot_time
10.9. Module clarification và ticket
Clarification
Thí sinh gửi câu hỏi.
Jury trả lời.
Gắn với task/phase.
Chuyển private thành public.
Ticket kỹ thuật
Báo lỗi upload.
Báo lỗi queue.
Báo lỗi điểm số.
Theo dõi trạng thái xử lý.
•
•

•
•
•
•

•
•
•
•
•
•

•
•
•
•
•
•

•
•
•
•

•
•
•
•

14

Announcement
Gửi thông báo toàn contest.
Gửi thông báo theo task.
Ghim thông báo khẩn.
10.10. Module rejudge và hậu kiểm
Rejudge
Chấm lại 1 submission.
Chấm lại theo task.
Chấm lại theo phase.
Chấm lại hàng loạt khi metric thay đổi.
Hậu kiểm
Chạy lại model ở phase cuối.
So sánh output sinh lại với output trước đó.
So sánh hash model/source giữa final public và final private.
Lưu kết quả xác minh.

11. Quy trình nghiệp vụ chính
11.1. Quy trình đăng ký và tham gia contest
Người dùng tạo tài khoản.
Người dùng tạo đội hoặc tham gia đội.
Đội đăng ký contest.
Hệ thống xác nhận quyền tham gia.
11.2. Quy trình nộp bài
Thí sinh vào task và phase tương ứng.
Chọn file hoặc gói artifact để nộp.
Hệ thống kiểm tra sơ bộ phía client.
File được upload lên server.
Hệ thống tạo submission record.
Job được đưa vào hàng đợi.
11.3. Quy trình chấm bài
Worker lấy submission từ queue.
Validator kiểm tra cấu trúc bài nộp.
Nếu hợp lệ, submission chuyển sang executor/scorer.
•
•
•

•
•
•
•

•
•
•
•

1.
2.
3.
4.

1.
2.
3.
4.
5.
6.

1.
2.
3.

15

Hệ thống tính metric.
Kết quả được lưu và gửi về frontend.
Leaderboard được cập nhật.
11.4. Quy trình clarification
Thí sinh gửi câu hỏi.
Jury đọc và phản hồi.
Nếu cần, phản hồi được công khai cho mọi đội.
Hệ thống lưu lịch sử và trạng thái.
11.5. Quy trình rejudge
Admin chọn submission hoặc phase.
Hệ thống tạo các job rejudge.
Worker chấm lại.
Kết quả mới được lưu kèm lịch sử thay đổi.
Leaderboard được đồng bộ lại nếu cần.

12. Thiết kế dữ liệu mức khái niệm
12.1. Các thực thể chính
User
Team
TeamMember
Contest
Task
Phase
Dataset
Submission
SubmissionFile
EvaluationJob
Score
LeaderboardEntry
Announcement
Clarification
Ticket
AuditLog
12.2. Quan hệ giữa các thực thể
Một User có thể thuộc nhiều Team theo chính sách hệ thống.
Một Team có nhiều Submission.
Một Contest có nhiều Task.
4.
5.
6.

1.
2.
3.
4.

1.
2.
3.
4.
5.

•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•

•
•
•

16

Một Task có nhiều Phase.
Một Submission thuộc về đúng một Team, một Task và một Phase.
Một Submission có thể có nhiều SubmissionFile.
Một Submission sinh ra một hoặc nhiều EvaluationJob.
Một Submission có một Score chính và có thể có nhiều thành phần metric.
Clarification và Ticket gắn với Contest, Task, Phase hoặc Team.
AuditLog ghi nhận thao tác trên các đối tượng quan trọng.

13. Công nghệ dự kiến sử dụng
13.1. Frontend
ReactJS
Ant Design hoặc Material UI
React Router
Axios hoặc TanStack Query
13.2. Backend
FastAPI hoặc NestJS
REST API
WebSocket cho trạng thái real-time nếu cần
13.3. Cơ sở dữ liệu và lưu trữ
PostgreSQL cho dữ liệu nghiệp vụ
Redis cho cache và queue support
MinIO hoặc S3-compatible storage cho artifact
13.4. Hệ thống hàng đợi và worker
Celery/RQ với Redis hoặc RabbitMQ
Worker CPU và GPU tách riêng nếu cần
13.5. Sandbox và triển khai
Docker cho môi trường chấm code-based
Docker Compose cho triển khai thử nghiệm
Nginx làm reverse proxy
13.6. Logging và monitoring
Logging file hoặc ELK nhẹ tùy điều kiện
Prometheus/Grafana là hướng mở rộng
•
•
•
•
•
•
•

•
•
•
•

•
•
•

•
•
•

•
•

•
•
•

•
•

17

14. Lựa chọn hướng triển khai phù hợp cho đồ án
14.1. Hướng triển khai ưu tiên
Để bảo đảm tiến độ và tính khả thi, đồ án nên triển khai theo hai mức:
Mức 1: Lõi bắt buộc
Quản lý contest, task, phase.
Quản lý user và team.
Upload submission.
Validation cơ bản.
Output-based judging.
Metric plugin cơ bản.
Leaderboard.
Announcement + clarification.
Admin dashboard cơ bản.
Mức 2: Nâng cao
Docker sandbox.
Code-based execution.
Rejudge hàng loạt.
Hậu kiểm final submission.
Freeze leaderboard.
Normalized score.
14.2. Lý do lựa chọn
Cách triển khai theo lớp như trên giúp:
Đảm bảo đồ án có sản phẩm chạy được.
Vẫn có phần nâng cao để thể hiện chiều sâu kỹ thuật.
Tránh rủi ro ôm quá nhiều chức năng ngay từ đầu.

15. Kế hoạch thực hiện dự kiến
Giai đoạn 1: Khảo sát và phân tích yêu cầu
Nghiên cứu mô hình thi AI.
Phân tích các loại task và phase.
Chốt phạm vi và use case.
Thiết kế sơ bộ kiến trúc hệ thống.
•
•
•
•
•
•
•
•
•

•
•
•
•
•
•

•
•
•

•
•
•
•

18

Giai đoạn 2: Thiết kế hệ thống
Thiết kế cơ sở dữ liệu.
Thiết kế API.
Thiết kế module submission, judging, leaderboard.
Thiết kế giao diện.
Giai đoạn 3: Xây dựng backend lõi
Auth và phân quyền.
Contest, task, phase management.
Submission service.
Validation service.
Scoring pipeline cơ bản.
Giai đoạn 4: Xây dựng frontend
Giao diện contestant.
Giao diện admin.
Trang leaderboard.
Trang clarification.
Giai đoạn 5: Tích hợp worker và queue
Job queue.
Validation worker.
Scoring worker.
Rejudge cơ bản.
Giai đoạn 6: Kiểm thử và đánh giá
Kiểm thử chức năng.
Kiểm thử tải nhẹ.
Mô phỏng cuộc thi nhỏ.
Đánh giá kết quả.
Giai đoạn 7: Hoàn thiện báo cáo và demo
Viết báo cáo.
Chuẩn bị dữ liệu minh họa.
Chuẩn bị kịch bản demo.
Tối ưu và sửa lỗi cuối.
•
•
•
•

•
•
•
•
•

•
•
•
•

•
•
•
•

•
•
•
•

•
•
•
•

19

16. Phương pháp đánh giá hệ thống
16.1. Đánh giá về chức năng
Hệ thống có hỗ trợ đầy đủ quản lý contest, task, phase không.
Có nộp bài được không.
Có chấm tự động được không.
Có leaderboard không.
Có clarification và announcement không.
Có rejudge không.
16.2. Đánh giá về hiệu năng
Thời gian xử lý một submission.
Thời gian cập nhật leaderboard.
Khả năng xử lý nhiều submission liên tiếp.
Mức sử dụng tài nguyên worker.
16.3. Đánh giá về độ ổn định
Submission lỗi có được xử lý đúng không.
Worker lỗi có làm mất bài nộp không.
Queue có phục hồi được không.
16.4. Đánh giá về trải nghiệm người dùng
Quy trình nộp bài có rõ ràng không.
Lỗi format có dễ hiểu không.
Giao diện có thuận tiện khi thi thật không.
16.5. Đánh giá về tính mở rộng
Có thể thêm metric mới nhanh không.
Có thể thêm task mới mà không sửa nhiều code không.
Có thể thêm worker mới khi lượng job tăng không.

----bổ sung thêm sau khi đã làm xong----
làm UI để code luôn trên web, rồi từ server web kết nối đến server GPU để thực thi, không cho thí sinh can thiệp và môi trường