
const Comment = require('../../Models/comment')
const Users = require('../../Models/user')
const Order = require('../../Models/order')
const Detail_Order = require('../../Models/detail_order')
const mongoose = require('mongoose');

// Gọi API hiện thị list comment của sản phẩm 
// Phương thức GET
module.exports.index = async (req, res) => {
    const id_product = req.params.id
    const comment_product = await Comment.find({ id_product: id_product }).populate('id_user')
    res.json(comment_product)
}

// Kiểm tra người dùng có thể đánh giá sản phẩm hay không
// Phương thức GET
module.exports.check_can_review = async (req, res) => {
    try {
        const id_product = req.params.id_product
        const id_user = req.params.id_user
        
        console.log(`Checking review permission for user ${id_user} and product ${id_product}`);
        
        // Kiểm tra định dạng ID
        if (!mongoose.Types.ObjectId.isValid(id_product) || !mongoose.Types.ObjectId.isValid(id_user)) {
            console.log('Invalid ID format');
            return res.json({ 
                canReview: false, 
                message: "ID không hợp lệ" 
            });
        }
        
        // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
        const existingComment = await Comment.findOne({ 
            id_product: id_product,
            id_user: id_user
        })
        
        console.log('Existing comment:', existingComment);

        if (existingComment) {
            return res.json({ 
                canReview: false, 
                message: "Bạn đã đánh giá sản phẩm này rồi" 
            })
        }

        // Tìm tất cả đơn hàng đã hoàn thành của người dùng (status = 4 là đã hoàn thành)
        const completedOrders = await Order.find({ 
            id_user: id_user,
            status: "4"  // Chỉ lấy đơn hàng có status = 4 (Hoàn thành)
        })
        
        console.log('Completed orders:', completedOrders);

        if (!completedOrders || completedOrders.length === 0) {
            return res.json({ 
                canReview: false, 
                message: "Bạn cần mua sản phẩm và nhận hàng thành công trước khi đánh giá" 
            })
        }

        // Kiểm tra xem người dùng đã mua sản phẩm này chưa
        let hasPurchased = false
        const productIdStr = id_product.toString();
        
        console.log('Looking for product ID:', productIdStr);
        
        for (const order of completedOrders) {
            console.log(`Checking order ${order._id}`);
            
            const orderDetails = await Detail_Order.find({
                id_order: order._id
            })
            
            console.log(`Order details for ${order._id}:`, orderDetails);
            
            for (const detail of orderDetails) {
                const detailProductId = detail.id_product.toString();
                console.log(`Comparing: ${detailProductId} vs ${productIdStr}`);
                
                if (detailProductId === productIdStr) {
                    console.log('Match found! User has purchased this product.');
                    hasPurchased = true;
                    break;
                }
            }
            
            if (hasPurchased) break;
        }

        if (!hasPurchased) {
            console.log('User has not purchased this product');
            return res.json({ 
                canReview: false, 
                message: "Bạn cần mua sản phẩm này và nhận hàng thành công trước khi đánh giá" 
            })
        }

        console.log('User can review this product');
        // Người dùng có thể đánh giá
        res.json({ 
            canReview: true, 
            message: "Bạn có thể đánh giá sản phẩm này" 
        })
    } catch (error) {
        console.error('Error in check_can_review:', error)
        res.status(500).json({ 
            canReview: false, 
            message: "Đã xảy ra lỗi khi kiểm tra quyền đánh giá" 
        })
    }
}

// Gửi comment
// Phương Thức Post
module.exports.post_comment = async (req, res) => {
    try {
        const id_product = req.params.id
        const id_user = req.body.id_user

        // Kiểm tra định dạng ID
        if (!mongoose.Types.ObjectId.isValid(id_product) || !mongoose.Types.ObjectId.isValid(id_user)) {
            return res.status(400).json({ 
                success: false, 
                message: "ID không hợp lệ" 
            });
        }

        // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
        const existingComment = await Comment.findOne({ 
            id_product: id_product,
            id_user: id_user
        })

        if (existingComment) {
            return res.status(400).json({ 
                success: false, 
                message: "Bạn đã đánh giá sản phẩm này rồi" 
            })
        }

        // Tìm tất cả đơn hàng đã hoàn thành của người dùng
        const completedOrders = await Order.find({ 
            id_user: id_user,
            status: "4"  // Chỉ lấy đơn hàng có status = 4 (Hoàn thành)
        })

        if (!completedOrders || completedOrders.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Bạn cần mua sản phẩm và nhận hàng thành công trước khi đánh giá" 
            })
        }

        // Kiểm tra xem người dùng đã mua sản phẩm này chưa
        let hasPurchased = false
        const productIdStr = id_product.toString();
        
        for (const order of completedOrders) {
            const orderDetails = await Detail_Order.find({
                id_order: order._id
            })

            for (const detail of orderDetails) {
                if (detail.id_product.toString() === productIdStr) {
                    hasPurchased = true;
                    break;
                }
            }
            
            if (hasPurchased) break;
        }

        if (!hasPurchased) {
            return res.status(400).json({ 
                success: false, 
                message: "Bạn cần mua sản phẩm này và nhận hàng thành công trước khi đánh giá" 
            })
        }

        // Tạo comment mới
        const data = {
            id_product: mongoose.Types.ObjectId(id_product),
            id_user: mongoose.Types.ObjectId(id_user),
            content: req.body.content,
            star: req.body.star
        }

        await Comment.create(data)

        res.json({
            success: true,
            message: "Đánh giá của bạn đã được gửi thành công"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            success: false, 
            message: "Đã xảy ra lỗi khi gửi đánh giá" 
        })
    }
}
