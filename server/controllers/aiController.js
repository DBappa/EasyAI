import { OpenAI } from "openai";
import db from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
//import pdf from 'pdf-parse/lib/pdf-parse.js';
//import pdf from 'pdf-parse';

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan === "premium" && free_usage > 10) {
      return res.json({
        success: false,
        message:
          "You have reached your free usage limit. Upgrade to premium to generate more articles.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: length,
    });

    const content= response.choices[0].message.content;

    await db `INSERT INTO creations (user_id, prompt, content,type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        }, 
      })
    }

    res.json({
      success: true,
      message: "Article generated successfully",
      content,
    });

  } catch (error) {

    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt} = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan === "premium" && free_usage > 10) {
      return res.json({
        success: false,
        message:
          "You have reached your free usage limit. Upgrade to premium to generate more articles.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content= response.choices[0].message.content;

    await db `INSERT INTO creations (user_id, prompt, content,type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        }, 
      })
    }

    res.json({
      success: true,
      message: "Blog Title generated successfully",
      content,
    });

  } catch (error) {

    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;
    // const free_usage = req.free_usage;

    if (plan === "premium") {
      return res.json({
        success: false,
        message:
          "This feature is only available for premium subscriptions",
      });
    }

    //Clipdrop API Configuration
    const formData = new FormData();
    formData.append("prompt", prompt);
    
  const data= await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
      headers: {'x-api-key': process.env.CLIPDROP_API_KEY},
      responseType: 'arraybuffer',
    })

    const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

   // const content= response.choices[0].message.content;

   //Cloudinary configurations
   
    const {secure_url} = await cloudinary.uploader.upload(base64Image);


    await db `INSERT INTO creations (user_id, prompt, content,type,publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image',${publish??false})`;

    res.json({
      success: true,
      message: "Article generated successfully",
      content:secure_url,
    });

  } catch (error) {

    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {image}= req.file;
    const plan = req.plan;
    // const free_usage = req.free_usage;

    if (plan === "premium") {
      return res.json({
        success: false,
        message:
          "This feature is only available for premium subscriptions",
      });
    }

    

   // const content= response.choices[0].message.content;

   //Cloudinary configurations
   
    const {secure_url} = await cloudinary.uploader.upload(image.path,{
      transformations: [
        {
          effect: 'remove_background',
          background_removal: 'remove_the_background'

        }
      ]
    });


    await db `INSERT INTO creations (user_id, prompt, content,type) VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;

    res.json({
      success: true,
      message: "Background Removed successfully",
      content:secure_url,
    });

  } catch (error) {

    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {object}= req.body;
    const {image}= req.file;
    const plan = req.plan;
    // const free_usage = req.free_usage;

    if (plan === "premium") {
      return res.json({
        success: false,
        message:
          "This feature is only available for premium subscriptions",
      });
    }

    

   // const content= response.choices[0].message.content;

   //Cloudinary configurations
   
    const {public_id} = await cloudinary.uploader.upload(image.path);

  const imageUrl= cloudinary.url(public_id, {
      transformations: [
        {
          effect: `gen_remove_object:${object}`

        }
      ],
      resource_type: 'image',
    });


    await db `INSERT INTO creations (user_id, prompt, content,type) VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

    res.json({
      success: true,
      message: "Object Removed successfully",
      content:imageUrl,
    });

  } catch (error) {

    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export const resumeReview = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const resume= req.file;
    const plan = req.plan;
    // const free_usage = req.free_usage;

    if (plan === "premium") {
      return res.json({
        success: false,
        message:
          "This feature is only available for premium subscriptions",
      });
    }

    

   // const content= response.choices[0].message.content;

   //Cloudinary configurations
   
    if(resume.size>5*1024*1024){
      return res.json({
        success: false,
        message:
          "Resume size should be less than 5mb",
      });
    }

    const dataBuffer= fs.readFileSync(resume.path);
    const { default: pdf } = await import('pdf-parse');
    const pdfData = await  pdf(dataBuffer);

    const prompt = `Review the following resume and provide constructive feedback on its strengths,weaknesses, and areas for improvement. 
    Focus on the resume's overall quality and potential to succeed in the job market. If the resume is missing critical information,
    provide suggestions on how to improve it. Resume Content: \n\n ${pdfData.text}`

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content= response.choices[0].message.content;

    await db `INSERT INTO creations (user_id, prompt, content,type) VALUES (${userId}, 'Review the uploaded Resume', ${content}, 'Resume Review')`;

    res.json({
      success: true,
      message: "Review generated successfully",
      content
    });

  } catch (error) {

    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
