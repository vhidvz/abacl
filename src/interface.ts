import { Grant } from './grant';

/**
 * `Ability` is a type that represents a single access ability.
 *
 * @property {S} subject - The subject that is allowed to perform the action on the object.
 * @property {Act | 'any'} action - The action that the subject is allowed to perform on the object.
 * @property {Obj | 'all'} object - The object that the user is trying to access.
 * @property {string[]} field - The field property is used to specify the fields that are allowed to be
 * accessed.
 * @property {string[]} filter - A list of filters that can be applied to the object.
 * @property {string[]} location - IP address or CIDR
 * @property {{
 *     cron_exp: string; // start cron expression
 *     duration: number; // in seconds
 *   }[]} time - This is an array of objects that contain a cron expression and a duration. The cron
 * expression is used to determine when the access ability is valid. The duration is used to determine
 * how long the access ability is valid.
 */
export type Ability<S = string, Act = string, Obj = string> = {
  subject: S;
  action: Act | 'any'; // scoped by separator
  object: Obj | 'all'; // scoped by separator
  field?: string[]; // does not affect on grant or deny permission
  filter?: string[]; // does not affect on grant or deny permission
  location?: string[]; // ip or cidr
  time?: Time[];
};

/**
 * `Time` is an object with two properties, `cron_exp` and `duration`, where `cron_exp` is a string and
 * `duration` is a number.
 *
 * @property {string} cron_exp - This is the cron expression that will be used to start the job.
 * @property {number} duration - The duration of the job in seconds.
 */
export type Time = {
  cron_exp: string; // start cron expression
  duration: number; // in seconds
};

/**
 * `PermissionGrant` is an object whose keys are strings and whose values are `Grant`s.
 *
 * @property [key: string] - Grant<S, Act, Obj>;
 */
export type PermissionGrant<S = string, Act = string, Obj = string> = {
  [key: string]: Grant<S, Act, Obj>;
};

export interface AccessControlOption {
  sep?: string;
  strict?: boolean;
}
