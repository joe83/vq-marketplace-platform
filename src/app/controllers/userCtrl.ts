import * as async from "async";
import { VQ } from "../../core/interfaces";

export const updateProperty = (models: any, userId: number, propKey: string, propValue: string, callback: (err: VQ.APIError, savedProperty: any) => void) => {
    const property = {
        userId,
        propValue,
        propKey
    };

    let commitedProperty: any;

    async
    .waterfall([
        (cb: VQ.StandardCallback) => models.userProperty.findOne({
            where: {
                $and: [
                    { userId },
                    { propKey: property.propKey }
                ]
                
            }
        })
        .then((prop: any) => cb(null, prop), cb),
        (prop: any, cb: VQ.StandardCallback) => {
            if (prop) {
                return prop
                    .update({
                        propValue
                    })
                    .then(() => {
                        commitedProperty = prop;
                        
                        return cb();
                    }, cb);
            }

            return models
                .userProperty
                .create(property)
                .then((newProperty: any) => {
                    commitedProperty = newProperty;

                    return cb();
                }, cb);
        }
    ], (err: any) => {
        return callback(err, commitedProperty);
    });
};
