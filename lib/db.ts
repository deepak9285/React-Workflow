import { z } from "zod";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_DB_URI;


let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!MONGO_URI) throw new Error("MONGO_DB_URI missing");

  await mongoose.connect(MONGO_URI);
  isConnected = true;
}

await connectDB();


const WorkflowDataSchema = z.object({
  workflowName: z.string().min(1),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});
const workflowMongooseSchema = new mongoose.Schema(
  {
    workflowName: { type: String, required: true },
    nodes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    edges: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

const Workflow =
  mongoose.models.Workflow ||
  mongoose.model("Workflow", workflowMongooseSchema);

export const saveWorkFlow = async (
  workflowData: z.infer<typeof WorkflowDataSchema>
) => {
  try {
    console.log("Saving Workflow Data:", workflowData); 
    const parsedData = WorkflowDataSchema.parse(workflowData);
    console.log("Parsed Data:", parsedData);
    const savedWorkflow = await Workflow.create(parsedData);

    return { success: true, data: savedWorkflow };
  } catch (error: any) {
    console.error("SAVE WORKFLOW ERROR:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: "zod_validation_error",
        details: error.format(),
      };
    }

    if (error.name === "ValidationError") {
      return {
        success: false,
        error: "mongoose_validation_error",
        details: error.errors,
      };
    }

    return {
      success: false,
      message: "Failed to save workflow",
      error: error.message,
    };
  }
};
