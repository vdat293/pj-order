# Thuc don duyet truoc - Pho Huong Phu

File nay la ban nhap de duyet truoc khi seed vao database. Gia dang de theo VND.

## Categories

| id | name | sort_order |
|---:|---|---:|
| 1 | Pho | 1 |
| 2 | Bun bo | 2 |
| 3 | Bun bo tron | 3 |
| 4 | Com ga xoi mo | 4 |
| 5 | Nuoc uong | 5 |

## Products

| category | name | price |
|---|---|---:|
| Pho | Pho bo vien | 35000 |
| Pho | Pho tai | 40000 |
| Pho | Pho nam | 40000 |
| Pho | Pho gan | 40000 |
| Pho | Pho ga | 40000 |
| Pho | Pho gau | 45000 |
| Pho | Pho 2 loai thit | 45000 |
| Pho | Pho dac biet | 60000 |
| Bun bo | Bun bo vien | 35000 |
| Bun bo | Bun bo tai | 40000 |
| Bun bo | Bun bo nam | 40000 |
| Bun bo | Bun bo gan | 40000 |
| Bun bo | Bun bo ga | 40000 |
| Bun bo | Bun bo gau | 45000 |
| Bun bo | Bun bo 2 loai thit | 45000 |
| Bun bo | Bun bo dac biet | 60000 |
| Bun bo tron | To thuong | 40000 |
| Bun bo tron | To dac biet | 60000 |
| Com ga xoi mo | Com dui ga | 35000 |
| Com ga xoi mo | Com dui ga goc tu | 45000 |
| Com ga xoi mo | Com ma dui | 25000 |
| Nuoc uong | Nuoc suoi | 10000 |
| Nuoc uong | Nuoc ngot cac loai | 15000 |
| Nuoc uong | Nuoc cam | 15000 |
| Nuoc uong | Tra tac | 15000 |

## Toppings / Mon them

| attach_to_category | type | name | price |
|---|---|---|---:|
| Pho | them | Banh them | 10000 |
| Pho | them | Chen trung | 10000 |
| Pho | them | Chen trung tiet | 15000 |
| Pho | cung | Chen thit | 30000 |
| Pho | cung | Chen gau | 35000 |
| Bun bo | them | Bun them | 10000 |
| Bun bo | them | Chen trung | 10000 |
| Bun bo | them | Chen trung tiet | 15000 |
| Bun bo | cung | Chen thit | 30000 |
| Bun bo | cung | Chen gau | 35000 |

## Seed-ready JSON draft

```json
{
  "categories": [
    { "id": 1, "name": "Phở", "sort_order": 1 },
    { "id": 2, "name": "Bún bò", "sort_order": 2 },
    { "id": 3, "name": "Bún bò trộn", "sort_order": 3 },
    { "id": 4, "name": "Cơm gà xối mỡ", "sort_order": 4 },
    { "id": 5, "name": "Nước uống", "sort_order": 5 }
  ],
  "products": [
    { "id": 1, "category_id": 1, "name": "Phở bò viên", "price": 35000, "description": "Phở bò viên nước dùng đậm vị, dùng nóng cùng rau thơm.", "sort_order": 1 },
    { "id": 2, "category_id": 1, "name": "Phở tái", "price": 40000, "description": "Phở bò tái mềm, nước dùng thơm ngọt.", "sort_order": 2 },
    { "id": 3, "category_id": 1, "name": "Phở nạm", "price": 40000, "description": "Phở nạm bò chín mềm, nước dùng thanh ngọt.", "sort_order": 3 },
    { "id": 4, "category_id": 1, "name": "Phở gân", "price": 40000, "description": "Phở gân bò giòn mềm, ăn kèm rau thơm.", "sort_order": 4 },
    { "id": 5, "category_id": 1, "name": "Phở gà", "price": 40000, "description": "Phở gà thịt mềm, nước dùng nhẹ và thơm.", "sort_order": 5 },
    { "id": 6, "category_id": 1, "name": "Phở gầu", "price": 45000, "description": "Phở gầu bò béo thơm, nước dùng đậm đà.", "sort_order": 6 },
    { "id": 7, "category_id": 1, "name": "Phở 2 loại thịt", "price": 45000, "description": "Tô phở kết hợp 2 loại thịt tùy chọn.", "sort_order": 7 },
    { "id": 8, "category_id": 1, "name": "Phở đặc biệt", "price": 60000, "description": "Tô phở đầy đủ nhiều loại thịt, khẩu phần lớn.", "sort_order": 8 },
    { "id": 9, "category_id": 2, "name": "Bún bò viên", "price": 35000, "description": "Bún bò viên nước dùng đậm vị, dùng nóng cùng rau thơm.", "sort_order": 1 },
    { "id": 10, "category_id": 2, "name": "Bún bò tái", "price": 40000, "description": "Bún bò tái mềm, nước dùng thơm ngọt.", "sort_order": 2 },
    { "id": 11, "category_id": 2, "name": "Bún bò nạm", "price": 40000, "description": "Bún bò nạm chín mềm, nước dùng đậm đà.", "sort_order": 3 },
    { "id": 12, "category_id": 2, "name": "Bún bò gân", "price": 40000, "description": "Bún bò gân giòn mềm, ăn kèm rau thơm.", "sort_order": 4 },
    { "id": 13, "category_id": 2, "name": "Bún bò gà", "price": 40000, "description": "Bún bò dùng kèm thịt gà, nước dùng nóng thơm.", "sort_order": 5 },
    { "id": 14, "category_id": 2, "name": "Bún bò gầu", "price": 45000, "description": "Bún bò gầu béo thơm, nước dùng đậm đà.", "sort_order": 6 },
    { "id": 15, "category_id": 2, "name": "Bún bò 2 loại thịt", "price": 45000, "description": "Tô bún bò kết hợp 2 loại thịt tùy chọn.", "sort_order": 7 },
    { "id": 16, "category_id": 2, "name": "Bún bò đặc biệt", "price": 60000, "description": "Tô bún bò đầy đủ nhiều loại thịt, khẩu phần lớn.", "sort_order": 8 },
    { "id": 17, "category_id": 3, "name": "Bún bò trộn tô thường", "price": 40000, "description": "Bún bò trộn rau tươi, thịt bò và nước sốt đậm vị.", "sort_order": 1 },
    { "id": 18, "category_id": 3, "name": "Bún bò trộn tô đặc biệt", "price": 60000, "description": "Bún bò trộn khẩu phần đặc biệt, nhiều thịt hơn.", "sort_order": 2 },
    { "id": 19, "category_id": 4, "name": "Cơm đùi gà", "price": 35000, "description": "Cơm đùi gà xối mỡ da giòn, ăn kèm rau và nước chấm.", "sort_order": 1 },
    { "id": 20, "category_id": 4, "name": "Cơm đùi gà góc tư", "price": 45000, "description": "Cơm đùi gà góc tư xối mỡ, khẩu phần lớn.", "sort_order": 2 },
    { "id": 21, "category_id": 4, "name": "Cơm má đùi", "price": 25000, "description": "Cơm má đùi gà xối mỡ, phần gọn dễ ăn.", "sort_order": 3 },
    { "id": 22, "category_id": 5, "name": "Nước suối", "price": 10000, "description": "Nước suối đóng chai.", "sort_order": 1 },
    { "id": 23, "category_id": 5, "name": "Nước ngọt các loại", "price": 15000, "description": "Các loại nước ngọt đóng chai hoặc lon.", "sort_order": 2 },
    { "id": 24, "category_id": 5, "name": "Nước cam", "price": 15000, "description": "Nước cam giải khát.", "sort_order": 3 },
    { "id": 25, "category_id": 5, "name": "Trà tắc", "price": 15000, "description": "Trà tắc chua ngọt mát lạnh.", "sort_order": 4 }
  ],
  "toppings": [
    { "category_id": 1, "name": "Bánh thêm", "price": 10000, "type": "them" },
    { "category_id": 1, "name": "Chén trứng", "price": 10000, "type": "them" },
    { "category_id": 1, "name": "Chén trứng tiết", "price": 15000, "type": "them" },
    { "category_id": 1, "name": "Chén thịt", "price": 30000, "type": "cung" },
    { "category_id": 1, "name": "Chén gầu", "price": 35000, "type": "cung" },
    { "category_id": 2, "name": "Bún thêm", "price": 10000, "type": "them" },
    { "category_id": 2, "name": "Chén trứng", "price": 10000, "type": "them" },
    { "category_id": 2, "name": "Chén trứng tiết", "price": 15000, "type": "them" },
    { "category_id": 2, "name": "Chén thịt", "price": 30000, "type": "cung" },
    { "category_id": 2, "name": "Chén gầu", "price": 35000, "type": "cung" }
  ]
}
```
