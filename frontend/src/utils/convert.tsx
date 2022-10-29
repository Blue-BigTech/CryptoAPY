export const paddingTwoDigits = (num: any) => {
    return num.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
};