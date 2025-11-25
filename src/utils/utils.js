import crypto from 'crypto';
import CryptoJS from "crypto-js";

export default class Utils {

     static hashMD5(input) {

        const hash = crypto.createHash('md5');

        hash.update(input);

        return hash.digest('hex').toUpperCase();
    }


    static getFormattedDate() {
         const today = new Date();
         const year = today.getFullYear();
         const month = String(today.getMonth() + 1).padStart(2, '0');
         const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    static encrypt(apiKey) {
         return CryptoJS.AES.encrypt(apiKey, "your-actual-api-key-123").toString();
    }

    static decrypt(encryptedApiKey) {
         const bytes = CryptoJS.AES.decrypt(encryptedApiKey, "your-actual-api-key-123");
         return bytes.toString(CryptoJS.enc.Utf8);
    }
}