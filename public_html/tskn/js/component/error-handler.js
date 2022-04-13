import { NetworkError } from '../error/network.js';
import { UnexpectedResponseError } from '../error/unexpected-response.js';

/**
 * @param {string} message
 */
const showMessage = (message) => {
    /*
    setTimeout(() => {
        alert(message.toString());
    }, 500);
    */
    alert(message.toString());
};

/**
 * @param {NetworkError} error
 */
const handleNetworkError = (error) => {
    showMessage('通信エラーです。サーバーか回線の調子が悪いのかもしれません。しばらくしてからやり直してください。');
    console.error(error);
};

/**
 * @param {UnexpectedResponseError} error
 */
const handleUnexpectedResponseError = (error) => {
    let callback;
    switch (error.status) {
        case 400:
            showMessage('不正なリクエストです。');
            break;
        case 403:
            showMessage('セッションが切れています。もう一度合言葉を入力してください。');
            callback = () => {
                location.reload();
            };
            break;
        case 410:
            showMessage('存在しないか、すでに削除されています。');
            break;
        case 500:
            showMessage('サーバーエラーです。（何回も出るようだったらこっそり作者に伝えてください…）');
            break;
        default:
            showMessage('予期しないレスポンスです。（何回も出るようだったらこっそり作者に伝えてください…）');
    }
    console.error(error);
    if (typeof callback === 'function') {
        callback();
    }
};

/**
 * @param {Error} error
 */
const handleError = (error) => {
    showMessage('バグりました。すみません。（何回も出るようだったらこっそり作者に伝えてください…）');
    console.error(error);
};

/**
 * @param {*} error
 */
const handle = (error) => {
    if (error instanceof NetworkError) {
        handleNetworkError(error);
        return;
    }
    if (error instanceof UnexpectedResponseError) {
        handleUnexpectedResponseError(error);
        return;
    }
    handleError(error);
};

export const ErrorHandler = {
    handle,
};