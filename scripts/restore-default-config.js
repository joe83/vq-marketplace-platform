const models = require('../app/models/models.js');

models.appConfig.addDefaultConfig(true);

models.appLabel.addDefaultLangLabels('en', true);

models.appUserProperty.addDefaultUserProperties(true);