const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Xử lý yêu cầu chat từ người dùng
module.exports.chat = async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: "system", 
          content: "Bạn là nhân viên tư vấn sản phẩm của cửa hàng H&A, chỉ trả lời các câu hỏi liên quan đến sản phẩm, dịch vụ và chính sách của cửa hàng. Nếu câu hỏi không liên quan, hãy trả lời: 'Xin lỗi, tôi chỉ hỗ trợ thông tin về sản phẩm và dịch vụ của cửa hàng H&A'." 
        },
        { role: "user", content: message },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).send("Có lỗi xảy ra khi xử lý yêu cầu!");
  }
}
