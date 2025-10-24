import db from "../configs/db.js";


export const getUserCreations =async (req,res) =>{
    try{
        const {userId}= await req.auth();
        const creations= await db `SELECT * FROM creations WHERE user_id=${userId} ORDER BY created_at DESC`;
        res.json({success: true, creations})
    }catch(err){
        console.log(err);
        res.json({success: false, message: err.message});
    }
}

export const getPublishedCreations =async (req,res) =>{
    try{
        const creations= await db `SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`;
        res.json({success: true, creations})
    }catch(err){
        console.log(err);
        res.json({success: false, message: err.message});
    }
}

export const toggleLikeCreation =async (req,res) =>{
    try{
        const {userId}= await req.auth();
        const {id}= req.body;

        const creation= await db `SELECT * FROM creations WHERE id=${id}`;

        if(!creation){
            return res.json({success: false, message: "Creation not found"});
        }

        const currentLikes=creation[0].likes;
        console.log(creation);
        console.log(currentLikes);
        const userIdStr=userId.toString()
        let updatedLikes;
        let message;

        if(currentLikes.includes(userIdStr)){
            updatedLikes= currentLikes.filter(like => like !== userIdStr);
            message="Creation unliked";
        }else{
            updatedLikes=[...currentLikes, userIdStr];
            message="Creation liked";
        }

        const formattedArray=`{${updatedLikes.join(",")}}`;

        await db `UPDATE creations SET likes=${formattedArray}::text[] WHERE id=${id}`;

        
        res.json({success: true, message})
    }catch(err){
        console.log(err);
        res.json({success: false, message: err.message});
    }
}