import QRCode from 'qrcode';

const generateQrCode = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const baseUrl = process.env.BASE_URL || 'https://fms.amnex.co.in/';
    const qrData = `${baseUrl}/attendance/mark?token=${token}`;
    const qrCode = await QRCode.toDataURL(qrData);

    return res.status(200).json({ qrCode });
  } catch (error) {
    return res.status(500).json({ error: 'Error generating QR code' });
  }
};

export default generateQrCode;