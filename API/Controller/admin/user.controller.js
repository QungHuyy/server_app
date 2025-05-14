const User = require('../../../Models/user')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");

module.exports.index = async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    const keyWordSearch = req.query.search;

    const perPage = parseInt(req.query.limit) || 8;
    const totalPage = Math.ceil(await User.countDocuments() / perPage);

    let start = (page - 1) * perPage;
    let end = page * perPage;
    let users;
    if (req.query.permission) {
        users = await User.find({ id_permission: req.query.permission }).populate('id_permission')
    } else {
        users = await User.find({}).populate('id_permission')
    }


    if (!keyWordSearch) {
        res.json({
            users: users.slice(start, end),
            totalPage: totalPage
        })

    } else {
        var newData = users.filter(value => {
            return value.fullname.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.id.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1
        })

        res.json({
            users: newData.slice(start, end),
            totalPage: totalPage
        })
    }
}

module.exports.create = async (req, res) => {
    const { email, password, fullname, username, permission } = req.body;

    // Kiểm tra xem email có đã tồn tại chưa
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
        return res.json({ msg: "Email đã tồn tại" });
    }

    // Mã hóa mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo mới người dùng
    const newUser = new User({
        email,
        password: hashedPassword,
        fullname,
        username,
        id_permission: permission // Gán quyền người dùng, có thể lấy từ ID của Permission
    });

    try {
        // Lưu người dùng vào cơ sở dữ liệu
        const savedUser = await newUser.save();

        // Tạo token JWT
        const token = jwt.sign({ userId: savedUser._id }, 'gfdgfd', { expiresIn: '1h' });

        // Trả về thông tin người dùng và token
        res.json({
            msg: "Đăng ký thành công",
            user: savedUser,
            jwt: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Lỗi server, không thể tạo tài khoản" });
    }

};
module.exports.delete = async (req, res) => {
    const id = req.query.id;

    await User.deleteOne({ _id: id }, (err) => {
        if (err) {
            res.json({ msg: err })
            return;
        }
        res.json({ msg: "Thanh Cong" })
    })

}

module.exports.details = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });

    res.json(user)
}

module.exports.update = async (req, res) => {
    const user = await User.findOne({ _id: req.query.id });
    if (req.query.email && req.query.email !== user.email) {
        req.query.email = user.email
    }
    if (req.query.username && req.query.username !== user.username) {
        req.query.username = user.username
    }
    if (!req.query.password) {
        req.query.password = user.password;
    } else {
        const salt = await bcrypt.genSalt();
        req.query.password = await bcrypt.hash(req.query.password, salt);
    }

    req.query.name = req.query.name.toLowerCase().replace(/^.|\s\S/g, a => { return a.toUpperCase() })
    await User.updateOne({ _id: req.query.id }, {
        fullname: req.query.name,
        password: req.query.password,
        id_permission: req.query.permission
    }, function (err, res) {
        if (err) return res.json({ msg: err });
    });
    res.json({ msg: "Bạn đã update thành công" })
}

module.exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.json({ msg: "Không tìm thấy người dùng" });
    }

    // So sánh mật khẩu đã nhập với mật khẩu trong cơ sở dữ liệu
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
        return res.json({ msg: "Sai mật khẩu" });
    }

    // Tạo token JWT
    const token = jwt.sign({ userId: user._id }, 'gfdgfd', { expiresIn: '1h' });

    // Trả về phản hồi thành công với thông tin người dùng và token
    res.json({
        msg: "Đăng nhập thành công",
        user: {
            _id: user._id,
            email: user.email,
            fullname: user.fullname,
            username: user.username,
            id_permission: user.id_permission
        },
        jwt: token
    });
}