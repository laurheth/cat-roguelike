import { default as Critter, CritterParams } from './Critter';

interface PlayerParams extends CritterParams {

}

/** The player */
export default class Player extends Critter {
    constructor(params:PlayerParams) {
        super(params);
    }
}