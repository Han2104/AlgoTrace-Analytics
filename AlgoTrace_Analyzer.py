import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def setup_and_run_analysis(csv_path="benchmark_results.csv"):
    print("1. Khởi tạo môi trường phân tích...")
    output_dir = "AlgoTrace_Report"
    os.makedirs(output_dir, exist_ok=True)
    
    if not os.path.exists(csv_path):
        print(f"[LỖI] Không tìm thấy file '{csv_path}'.")
        print("Vui lòng đặt file này cùng thư mục với file script python.")
        return

    print("2. Đọc và làm sạch dữ liệu...")
    # Cấu trúc cột dựa trên định dạng: DFS,Warehouse,495,0.021,34,34,true,9
    columns = ['Algorithm', 'MapType', 'Trial', 'Time_ms', 'NodesExpanded', 'PathLength', 'PathFound', 'MaxFringe']
    
    try:
        # Xử lý lỗi thiếu Header trong file CSV của bạn
        df = pd.read_csv(csv_path, header=None, names=columns)
        
        # Ép kiểu dữ liệu để tránh lỗi tính toán
        df['Time_ms'] = pd.to_numeric(df['Time_ms'], errors='coerce')
        df['NodesExpanded'] = pd.to_numeric(df['NodesExpanded'], errors='coerce')
        df['PathLength'] = pd.to_numeric(df['PathLength'], errors='coerce')
        df['MaxFringe'] = pd.to_numeric(df['MaxFringe'], errors='coerce')
        
    except Exception as e:
        print(f"[LỖI] Không thể đọc định dạng CSV: {e}")
        return

    print("3. Tổng hợp số liệu thống kê...")
# Ép kiểu cột PathFound về chữ thường và xóa khoảng trắng thừa để so khớp
    df['PathFound'] = df['PathFound'].astype(str).str.strip().str.lower()
    
    # Lọc những bản ghi có chữ 'true'
    df_success = df[df['PathFound'] == 'true']
    
    if df_success.empty:
        print("\n[CẢNH BÁO LỚN] Dữ liệu sau khi lọc trống trơn. Hãy kiểm tra lại file CSV!")
        return
    
    summary = df_success.groupby(['MapType', 'Algorithm']).agg(
        Avg_Time_ms=('Time_ms', 'mean'),
        Avg_NodesExpanded=('NodesExpanded', 'mean'),
        Avg_PathLength=('PathLength', 'mean'),
        Avg_MemoryFringe=('MaxFringe', 'mean'),
        Success_Count=('PathFound', 'count')
    ).round(3).reset_index()

    # Xuất báo cáo dạng Excel
    excel_path = os.path.join(output_dir, "ThongKe_TongHop.xlsx")
    summary.to_excel(excel_path, index=False)
    print(f" -> Đã lưu báo cáo Excel tại: {excel_path}")

    print("4. Vẽ biểu đồ so sánh trực quan...")
    sns.set_theme(style="whitegrid")
    
    # Biểu đồ 1: Thời gian thực thi
    plt.figure(figsize=(12, 6))
    sns.barplot(data=summary, x='MapType', y='Avg_Time_ms', hue='Algorithm')
    plt.title('So sánh Thời gian thực thi trung bình (ms)', fontsize=14, pad=15)
    plt.ylabel('Thời gian (ms)')
    plt.xlabel('Loại Bản đồ')
    plt.legend(title='Thuật toán')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "Chart_Time.png"), dpi=300)
    plt.close()

    # Biểu đồ 2: Số nút đã duyệt (Độ phức tạp không gian)
    plt.figure(figsize=(12, 6))
    sns.barplot(data=summary, x='MapType', y='Avg_NodesExpanded', hue='Algorithm')
    plt.title('So sánh Số nút đã rà soát trung bình', fontsize=14, pad=15)
    plt.ylabel('Số nút (Nodes)')
    plt.xlabel('Loại Bản đồ')
    plt.legend(title='Thuật toán')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "Chart_NodesExpanded.png"), dpi=300)
    plt.close()
    # Biểu đồ 3: Bộ nhớ đỉnh điểm (Peak Memory / Max Fringe Size)
    plt.figure(figsize=(12, 6))
    sns.barplot(data=summary, x='MapType', y='Avg_MemoryFringe', hue='Algorithm')
    plt.title('So sánh Bộ nhớ sử dụng đỉnh điểm (Max Fringe Size)', fontsize=14, pad=15)
    plt.ylabel('Kích thước Hàng đợi lớn nhất (Số Node)')
    plt.xlabel('Loại Bản đồ')
    plt.legend(title='Thuật toán')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "Chart_MemoryFringe.png"), dpi=300)
    plt.close()

# Biểu đồ 4: So sánh Chất lượng đường đi (Độ dài Path)
    plt.figure(figsize=(12, 6))
    
    # Để tránh biểu đồ bị lệch quá mức do DFS thỉnh thoảng sinh ra đường siêu dài,
    # chúng ta có thể dùng biểu đồ Boxplot hoặc chỉ đơn giản là Barplot có giới hạn trục Y
    sns.barplot(data=summary, x='MapType', y='Avg_PathLength', hue='Algorithm')
    
    plt.title('So sánh Chất lượng đường đi (Độ dài đường đi trung bình)', fontsize=14, pad=15)
    plt.ylabel('Số bước đi (Path Length)')
    plt.xlabel('Loại Bản đồ')
    plt.legend(title='Thuật toán')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "Chart_PathLength.png"), dpi=300)
    plt.close()

    print(f"\nHOÀN TẤT! Toàn bộ báo cáo và biểu đồ đã được xuất ra thư mục '{output_dir}'.")

if __name__ == "__main__":
    setup_and_run_analysis()
