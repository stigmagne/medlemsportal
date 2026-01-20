import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
    // Currently hardcoded to 'no' as we primarily support Norwegian
    const locale = 'no';

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
