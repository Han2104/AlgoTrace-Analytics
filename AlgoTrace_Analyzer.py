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
    try:
        df = pd.read_csv(csv_path)

        if 'algorithm' in df.columns:
            df.rename(columns={'algorithm': 'Algorithm', 'map': 'MapType', 'trial': 'Trial', 'executionTimeMs': 'Time_ms', 'nodesExpanded': 'NodesExpanded', 'pathLength': 'PathLength', 'totalCost': 'TotalCost', 'pathFound': 'PathFound', 'maxFringeSize': 'MaxFringe'}, inplace=True)

        df['Time_ms'] = pd.to_numeric(df['Time_ms'], errors='coerce')
        df['NodesExpanded'] = pd.to_numeric(df['NodesExpanded'], errors='coerce')
        df['PathLength'] = pd.to_numeric(df['PathLength'], errors='coerce')
        df['TotalCost'] = pd.to_numeric(df['TotalCost'], errors='coerce')
        df['MaxFringe'] = pd.to_numeric(df['MaxFringe'], errors='coerce')

    except Exception as e:
        print(f"[LỖI] Không thể đọc định dạng CSV: {e}")
        return

    print("3. Tổng hợp số liệu thống kê...")
    df['PathFound'] = df['PathFound'].astype(str).str.strip().str.lower()
    df_success = df[df['PathFound'] == 'true']
    
    if df_success.empty:
        print("\n[CẢNH BÁO LỚN] Dữ liệu sau khi lọc trống trơn. Hãy kiểm tra lại file CSV!")
        return
    
    summary = df_success.groupby(['MapType', 'Algorithm']).agg(
        Avg_Time_ms=('Time_ms', 'mean'),
        Avg_NodesExpanded=('NodesExpanded', 'mean'),
        Avg_PathLength=('PathLength', 'mean'),
        Avg_TotalCost=('TotalCost', 'mean'),
        Avg_MemoryFringe=('MaxFringe', 'mean'),
        Success_Count=('PathFound', 'count')
    ).round(3).reset_index()

    excel_path = os.path.join(output_dir, "ThongKe_TongHop.xlsx")
    summary.to_excel(excel_path, index=False)
    print(f" -> Đã lưu báo cáo Excel tại: {excel_path}")

    print("4. Vẽ biểu đồ so sánh trực quan...")
    sns.set_theme(style="whitegrid")
    
    # Hàm hỗ trợ in số lên đỉnh cột
    def add_labels(ax):
        for container in ax.containers:
            ax.bar_label(container, fmt='%.0f', padding=3, fontsize=9)

    # Biểu đồ 1: Thời gian thực thi
    plt.figure(figsize=(12, 6))
    ax1 = sns.barplot(data=summary, x='MapType', y='Avg_Time_ms', hue='Algorithm')
    add_labels(ax1)
    plt.title('So sánh Thời gian thực thi trung bình (ms)', fontsize=14, pad=15)
    plt.ylabel('Thời gian (ms)')
    plt.xlabel('Loại Bản đồ')
    plt.legend(title='Thuật toán')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "Chart_Time.png"), dpi=300)
    plt.close()

    # Biểu đồ 2: Số nút đã duyệt (Độ phức tạp không gian)
    plt.figure(figsize=(12, 6))
    ax2 = sns.barplot(data=summary, x='MapType', y='Avg_NodesExpanded', hue='Algorithm')
    add_labels(ax2)
    plt.title('So sánh Số nút đã rà soát trung bình', fontsize=14, pad=15)
    plt.ylabel('Số nút (Nodes)')
    plt.xlabel('Loại Bản đồ')
    plt.legend(title='Thuật toán')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "Chart_NodesExpanded.png"), dpi=300)
    plt.close()

    # Biểu đồ 3: Bộ nhớ đỉnh điểm (Peak Memory / Max Fringe Size)
    plt.figure(figsize=(12, 6))
    ax3 = sns.barplot(data=summary, x='MapType', y='Avg_MemoryFringe', hue='Algorithm')
    add_labels(ax3)
    plt.title('So sánh Bộ nhớ sử dụng đỉnh điểm (Max Fringe Size)', fontsize=14, pad=15)
    plt.ylabel('Kích thước Hàng đợi lớn nhất (Số Node)')
    plt.xlabel('Loại Bản đồ')
    plt.legend(title='Thuật toán')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "Chart_MemoryFringe.png"), dpi=300)
    plt.close()

    # Biểu đồ 4: So sánh TỔNG CHI PHÍ đường đi (Total Path Cost) - Đã chốt giữ DFS
    plt.figure(figsize=(12, 6))
    ax4 = sns.barplot(data=summary, x='MapType', y='Avg_TotalCost', hue='Algorithm')
    add_labels(ax4)
    plt.title('So sánh Tổng chi phí đường đi (Total Path Cost)', fontsize=14, pad=15)
    plt.ylabel('Tổng chi phí (Trọng số)')
    plt.xlabel('Loại Bản đồ')
    plt.legend(title='Thuật toán')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "Chart_TotalCost.png"), dpi=300) 
    plt.close()

    print(f"\nHOÀN TẤT! Toàn bộ báo cáo và biểu đồ đã được xuất ra thư mục '{output_dir}'.")

if __name__ == "__main__":
    setup_and_run_analysis()