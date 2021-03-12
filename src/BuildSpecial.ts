import Critter from './Critter';
import Player from './Player';
import Game from './Game';
import Tile from './Tile';
import { Random } from 'roguelike-pumpkin-patch';

type CritterBuilder = (type:string, tile:Tile,rng:Random)=>Critter;

const BuildSpecial:CritterBuilder = (type:string, tile:Tile, rng:Random)=>{
    switch(type) {
        default:
        case "post":
            // Scratching post
            const critter = new Critter({
                startTile:tile,
                appearance:{
                    content:`<img src="./assets/scratchingPostBetter.png" alt="Scratching post.">`,
                    classList:[]
                },
                onInteract:(player:Player,game:Game)=>{
                    game.buildMessage("You sharpen your claws on the scratching post!");
                    player.sharpenClaws(rng.getNumber(2,5));
                    critter.die();
                }
            });
            return critter;
    }
};

export default BuildSpecial;