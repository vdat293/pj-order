const DEFAULT_DEV_JWT_SECRET = 'qr_order_dev_secret_change_me_32_chars_min';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (secret && secret.length >= 32) {
        return secret;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set to at least 32 characters in production');
    }

    return DEFAULT_DEV_JWT_SECRET;
};

module.exports = {
    getJwtSecret
};
