const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require("../../middleware/auth");
const Pan = require('../../models/pan');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route PAN api/pans
//@desc  Create a pan
//@access Private
router.post('/', [auth,[
    check('text', 'Text is required')
    .not()
    .isEmpty()
]], async (req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

    const newPan = new Pan({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
    }); 

        const pan = await newPan.save();
        res.json(pan);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error");
    }

});

//@Route    GET api/pans
//@desc     Get all pans
//@access   Private
router.get('/', auth, async (req, res) =>{
    try {
        const pans = await Pan.find().sort({ date: -1 });
        res.json(pans);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")       
    }
})


//@Route    GET api/pans/:id
//@desc     Get post by ID
//@access   Private
router.get('/:id', auth, async (req, res) =>{
    try {
        const pan = await Pan.findById(req.params.id);

        if(!pan) {
            return res.status(404).json({msg: 'Pan not found'});
        }

        res.json(pan);
    } catch (err) {
        console.error(err.message);
        if(err.kind === "ObjectId") {
            return res.status(404).json({msg: 'Pan not found'});
        }
        res.status(500).send("Server Error")       
    }
})


//@Route    DELETE api/pans/:id
//@desc     DELETE a Pan
//@access   Private
router.delete('/:id', auth, async (req, res) =>{
    try {
        const pan = await Pan.findById(req.params.id);
        
        if(!pan){
            return res.status(404).json({msg: 'Pan not found'});
        }
        // Check User
        if(pan.user.toString() !== req.user.id){
            return res.status(401).json({ msg: "User not authorized"});
        }

        await pan.remove();
    
        res.json({msg: "Pan removed"});
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({msg: 'Pan not found'});
        }
        res.status(500).send("Server Error")       
    }
})


//@Route    PUT api/pans/like/:id
//@desc     Like a pan
//@access   Private
router.put('/like/:id', auth, async (req, res) =>{
    try {
        const pan = await Pan.findById(req.params.id);

        /// Check if the post has already been liked
        if(pan.likes.filter(like =>like.user.toString() === req.user.id).length >0){
            return res.status(400).json({ msg: 'Pan already like'});
        }

        pan.likes.unshift({ user: req.user.id});

        await pan.save();

        res.json(pan.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")       
    }
})


//@Route    PUT api/pans/unlike/:id
//@desc     Like a pan
//@access   Private
router.put('/unlike/:id', auth, async (req, res) =>{
    try {
        const pan = await Pan.findById(req.params.id);

        /// Check if the post has already been liked
        if(pan.likes.filter(like =>like.user.toString() === req.user.id).length === 0){
            return res.status(400).json({ msg: 'Pan has not yet been liked'});
        }

       /// Get remove index
       const removeIndex = pan.likes.map(like => like.user.toString()).indexOf(req.user.id);

       pan.likes.splice(removeIndex, 1);

        await pan.save();

        res.json(pan.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")       
    }
})


//@route PAN api/pans/comment/:id
//@desc  Comment on a pan
//@access Private
router.post('/comment/:id', [auth,[
    check('text', 'Text is required')
    .not()
    .isEmpty()
    ]
],
    
    async (req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const pan = await Pan.findById(req.params.id);


    const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
    }; 

        pan.comments.unshift(newComment);
        await pan.save();
        
        res.json(pan.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error");
    }

});

//@route DELETE api/pans/comment/:id/:comment_id
//@desc  Delete comment
//@access Private
router.delete('/comment/:id/:comment_id', auth, async (req, res)=>{
    try {
        const pan = await Pan.findById(req.params.id);

        // Pull out comment
        const comment = pan.comments.find(comment => comment.id === req.params.comment_id);

        // Make sure comment exists
        if(!comment){
            return res.status(404).json({msg: 'Comment does not exist'});
        }

        // Check user
        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({msg: 'User not authorized'});
        }

         /// Get remove index
         const removeIndex = pan.comments
         .map(comment => comment.user.toString())
         .indexOf(req.user.id);

         pan.comments.splice(removeIndex, 1);

         await pan.save();

         res.json(pan.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;