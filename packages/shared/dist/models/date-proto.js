export function toDateProto(date) {
    return {
        timestamp: date.getTime(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        quarter: Math.floor(date.getMonth() / 3) + 1
    };
}
