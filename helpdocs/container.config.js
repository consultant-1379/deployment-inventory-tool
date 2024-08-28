define({
    defaultApp: 'helpdocs',
    name: 'Deployment Inventory Tool',
    properties: {
        '*': {
            i18n: {
                // global override, forces the locales for all packages
                // use with caution !
                locales: [
                    'en-us'
                ]
            }
        }
    }
});
