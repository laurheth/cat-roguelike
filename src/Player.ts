import Tile from './Tile';
import { default as Critter, CritterParams } from './Critter';
import FOV from './FOV';

interface PlayerParams  {
    fov:FOV;
    startTile:Tile;
}

/** The player */
export default class Player extends Critter {
    readonly fov:FOV;
    constructor(params:PlayerParams) {
        const { fov, startTile, ...rest } = params;
        super({
            startTile:startTile,
            appearance:{
                content:'<img src="./assets/cat.png" alt="A very good cat.">',
                classList:['player']
            }
        });

        this.fov = fov;
    }
    /** Act */
    act() {
        this.fov.look(this.currentTile);
        return new Promise(resolve => {
            const eventHandler = (event:KeyboardEvent)=>{
                if(this.handleEvent(event)) {
                    document.removeEventListener('keydown',eventHandler);
                    resolve(true);
                }
            }
            document.addEventListener('keydown',eventHandler);
        });
    }

    /** Event handler */
    handleEvent(event:KeyboardEvent) {
        let acted = false;
        switch(event.key) {
            case 'Right':
            case 'ArrowRight':
                acted = this.step(1,0);
                break;
            case 'Left':
            case 'ArrowLeft':
                acted = this.step(-1,0);
                break;
            case 'Up':
            case 'ArrowUp':
                acted = this.step(0,-1);
                break;
            case 'Down':
            case 'ArrowDown':
                acted = this.step(0,1);
                break;
        }
        return acted;
    }
}