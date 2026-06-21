// heuristics.js
// Header: Các hàm heuristic dùng cho A*.
// Ghi chú chuyên sâu:
// - Heuristic phải là admissible (không được ước lượng vượt quá chi phí tối thiểu thực)
//   để đảm bảo A* tìm được đường đi tối ưu.
// - Khoảng cách Manhattan phù hợp (admissible) cho lưới 4-láng giềng khi chi phí mỗi bước >= 1.
//   Nếu phép di chuyển cho phép đường chéo hoặc thang chi phí khác, có thể dùng Euclidean
//   hoặc heuristic đã được điều chỉnh tương ứng.
export const manhattanDistance = (r1, c1, r2, c2) => {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
};
