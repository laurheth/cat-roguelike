import Tile from './Tile';
import {default as Critter, CritterParams } from './Critter';
import { EventManager, Random } from 'roguelike-pumpkin-patch';
import Player from './Player';
import { default as Item, itemTypes } from './Item';
import Game from './Game';

interface FoeParams {
    type:string;
    startTile:Tile;
    rng:Random;
    event:EventManager;
    game:Game;
}

/** Foe */
export default class Foe extends Critter {
    readonly type:string;
    private rng:Random;
    private awake:number;
    private enthusiasm:number;
    private event:EventManager;
    private hp:number;
    private armor:number;
    private xp:number;
    private dmg:[number,number];
    private foodValue:number;
    private game:Game;
    private attackVerb:string;
    private corpseType:itemTypes;
    private noCorpse:boolean;
    constructor(params:FoeParams) {
        const { type, startTile, rng, event, game, ...rest } = params;
        const critterParams:CritterParams = {
            startTile:startTile,
            appearance:{
                content:'g',
                classList:[]
            }
        };
        let enthusiasm = 5;
        let hp=5;
        let armor=0;
        let xp=2;
        let foodValue=4;
        let dmg:[number,number]=[1,3];
        let attackVerb = "attacks";
        let name=type;
        let corpseType:itemTypes="food";
        let noCorpse=false;
        switch(type) {
            case 'Yendor':
                critterParams.appearance = {
                    content:`<img src="./assets/yendorMouse.png" alt="Mouse of Yendor">`,
                    classList:['mouse']
                }
                hp=40;
                xp=0;
                foodValue=0;
                dmg=[2,4];
                name="Mouse of Yendor";
                corpseType="victory";
                break;
            default:
            case 'mouse':
                critterParams.appearance = {
                    content:'<img src="./assets/mouse.png" alt="A mouse.">',
                    classList:['mouse']
                };
                hp = 6 + game.level/2;
                attackVerb = "bites";
                break;
            case 'ghost':
                critterParams.appearance = {
                    content:'<img src="./assets/ghost.png" alt="A ghost.">',
                    classList:['ghost']
                };
                hp = 5;
                armor = 7;
                dmg=[2,5];
                attackVerb = "haunts";
                noCorpse=true;
                break;
            case 'bug':
                critterParams.appearance = {
                    content:'<img src="./assets/bug.png" alt="A bug.">',
                    classList:['bug']
                };
                hp = 4 + game.level/3;
                armor = 1;
                foodValue = 2;
                attackVerb = "bites"
                break;
        }
        critterParams.appearance.classList.push('critter');
        super(critterParams);
        this.event = event;
        this.event.add(this);
        this.type = name;
        this.rng = rng;
        this.awake=-1;
        this.enthusiasm = enthusiasm;
        this.hp=hp;
        this.xp=xp;
        this.foodValue = foodValue;
        this.dmg = dmg;
        this.game=game;
        this.attackVerb = attackVerb;
        this.corpseType = corpseType;
        this.armor=armor;
        this.noCorpse = noCorpse;
    }

    get appearance() {
        if (this.awake < 0 && this.alive) {
            this.game.buildMessage(`The ${this.type} shouts!`);
        }
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
                        this.game.buildMessage(`The ${this.type} ${this.attackVerb} you!`);
                        stepResult.attackMe(this.rng.getNumber(...this.dmg));
                    }
                }
            }
        }
    }

    attackMe(damage:number) {
        damage = damage - this.armor;
        if(damage <= 0.5) {
            this.game.buildMessage("It's not very effective...");
            damage = 0.5;
        }
        this.hp -= damage;
        if (this.hp <= 0) {
            this.die();
            return this.xp;
        } else {
            return 0;
        }
    }

    public die() {
        if(this.type === "ghost") {
            this.game.buildMessage(`The ${this.type} was banished!`,"good");
        } else {
            this.game.buildMessage(`The ${this.type} dies!`,"good");
        }
        if (!this.noCorpse) {
            const corpse = new Item({
                appearance:this._appearance,
                tile:this.currentTile,
                type:this.corpseType,
                name:`dead ${this.type}`,
                value:this.foodValue,
            });
            corpse.appearance.classList.push('dead');
            this.currentTile.addClass("blood");
        }
        super.die();
    }
}