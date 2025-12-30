
import path from 'path'
import { z } from 'zod'
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_DB_URI
console.log("mongodb uri",MONGO_URI)
await mongoose.connect(MONGO_URI)
const WorkflowDataSchema = z.object({
    id: z.string().optional(),
    workflowName: z.string().min(1),
    description: z.string().optional(),
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
})
const workflowMongooseSchema = new mongoose.Schema({
    WorkflowName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    nodes: {
        type: [mongoose.Schema.Types.Mixed],
        required: true,
        default: []
    },
    edges: {
        type: [mongoose.Schema.Types.Mixed],
        required: true,
        default: []
    }
}, {
    timestamps: true 
})
const Workflow = mongoose.models.Workflow || mongoose.model("Workflow", workflowMongooseSchema)

export const saveWorkFlow = async (workflowData: z.infer<typeof WorkflowDataSchema>) => {
    try {
        const parsedData = WorkflowDataSchema.parse(workflowData);
        const savedWorkflow = await Workflow.findOneAndUpdate(
            { _id: parsedData.id },
            {
                ...parsedData, createdAt: new Date(),
                updatedAt: new Date()
            },
            { upsert: true, new: true }

        )
        return {
            success: true,
            data: savedWorkflow,
        }

    }
   catch (error:any) {
        if(error.name==="ZodError"){
            return {
                success: false,
                error: 'validation_error',
                details: error.format(),
            }
        }
        else{
            return {
                success: false,
                message:"Failed to save workflow",
                error:error.message
            }
        }
    }
}

