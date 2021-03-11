import Tile from './Tile';
import {default as Critter, CritterParams } from './Critter';
import { EventManager, Random } from 'roguelike-pumpkin-patch';
import Player from './Player';
import Item from './Item';

interface FoeParams {
    type:string;
    startTile:Tile;
    rng:Random;
    event:EventManager;
}

/** Foe */
export default class Foe extends Critter {
    private type:string;
    private rng:Random;
    private awake:number;
    private enthusiasm:number;
    private event:EventManager;
    private hp:number;
    private xp:number;
    private dmg:[number,number];
    private foodValue:number;
    constructor(params:FoeParams) {
        const { type, startTile, rng, event, ...rest } = params;
        const critterParams:CritterParams = {
            startTile:startTile,
            appearance:{
                content:'g',
                classList:[]
            }
        };
        let enthusiasm = 5;
        let hp=5;
        let xp=1;
        let foodValue=5;
        let dmg:[number,number]=[1,3];
        switch(type) {
            case 'mouse':
                critterParams.appearance = {
                    content:'<img src="./assets/mouse.png" alt="A mouse.">',
                    classList:['mouse']
                };
                hp = 6;
                break;
            default:
            case 'bug':
                critterParams.appearance = {
                    content:'b',
                    classList:['bug']
                };
                hp = 4;
                foodValue = 2;
                break;
        }
        critterParams.appearance.classList.push('critter');
        super(critterParams);
        this.event = event;
        this.event.add(this);
        this.type = type;
        this.rng = rng;
        this.awake=-1;
        this.enthusiasm = enthusiasm;
        this.hp=hp;
        this.xp=xp;
        this.foodValue = foodValue;
        this.dmg = dmg;
    }

    get appearance() {
        this.awake = this.enthusiasm;
        return this.getAppearance();
    }

    /** Act */
    act() {
        if (this.alive) {
            if (this.awake < 0) {
                const options = [[-1,0],[1,0],[0,1],[0,-1]];
                const step = this.rng.getRandomElement(options);
                this.step(step[0],step[1])
            } else {
                const possibleTiles:{tile:Tile,step:[number,number]}[] = [];
                for(let i=-1;i<2;i++) {
                    for(let j=-1;j<2;j++) {
                        if (Math.abs(i) + Math.abs(j) !== 1) {
                            continue;
                        }
                        const tile = this.currentTile.getNeighbour([i,j]);
                        if (tile && tile.passable) {
                            possibleTiles.push({
                                tile:tile,
                                step:[i,j],
                            });
                        }
                    }
                }
                const min = possibleTiles.find(x=>{
                    return x.tile.remembered === Math.min(...possibleTiles.map(y=>y.tile.remembered));
                });
                if (min) {
                    const stepResult = this.step(min.step[0],min.step[1]);
                    if (stepResult instanceof Player) {
                        stepResult.attackMe(this.rng.getNumber(...this.dmg));
                    }
                }
            }
        }
    }

    attackMe(damage:number) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.die();
            return this.xp;
        } else {
            return 0;
        }
    }

    public die() {
        const corpse = new Item({
            appearance:this._appearance,
            tile:this.currentTile,
            type:"food",
            name:`dead ${this.type}`,
            value:this.foodValue,
        });
        corpse.appearance.classList.push('dead');
        this.currentTile.addClass("blood");
        super.die();
    }
}