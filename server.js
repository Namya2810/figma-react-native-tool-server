const express = require("express");
const axios = require("axios");

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

const app = express();


app.use(express.json());


/* ------------------ HELPER FUNCTIONS ------------------ */

function rgbToHex(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);

  return `#${[r, g, b]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

function extractStyles(node) {
  let styles = {};

  // 🔹 AutoLayout direction
  if (node.layoutMode === "HORIZONTAL") {
    styles.flexDirection = "row";
  }

  if (node.layoutMode === "VERTICAL") {
    styles.flexDirection = "column";
  }

  // 🔹 Alignment mapping
  if (node.primaryAxisAlignItems === "CENTER") {
    styles.justifyContent = "center";
  }

  if (node.primaryAxisAlignItems === "SPACE_BETWEEN") {
    styles.justifyContent = "space-between";
  }

  if (node.counterAxisAlignItems === "CENTER") {
    styles.alignItems = "center";
  }

  // 🔹 Padding
  if (node.paddingLeft) styles.paddingLeft = node.paddingLeft;
  if (node.paddingRight) styles.paddingRight = node.paddingRight;
  if (node.paddingTop) styles.paddingTop = node.paddingTop;
  if (node.paddingBottom) styles.paddingBottom = node.paddingBottom;

  // 🔹 Spacing between children
  if (node.itemSpacing) {
    styles.gap = node.itemSpacing;
  }

  // 🔹 Width & Height (VERY IMPORTANT)
  if (node.absoluteBoundingBox) {
    styles.width = Math.round(node.absoluteBoundingBox.width);
    styles.height = Math.round(node.absoluteBoundingBox.height);
  }

  // 🔹 Background
  if (node.fills && node.fills.length > 0 && node.fills[0].type === "SOLID") {
    styles.backgroundColor = rgbToHex(node.fills[0].color);
  }

  // 🔹 Border radius
  if (node.cornerRadius) {
    styles.borderRadius = node.cornerRadius;
  }

  return styles;
}

function parseNode(node) {
  let code = "";

 if (node.type === "TEXT") {
  let textStyles = {};

  if (node.style) {
    textStyles.fontSize = node.style.fontSize;
    textStyles.fontWeight = node.style.fontWeight?.toString();

    // 🔹 NEW: line height
    if (node.style.lineHeightPx) {
      textStyles.lineHeight = node.style.lineHeightPx;
    }

    // 🔹 NEW: letter spacing
    if (node.style.letterSpacing) {
      textStyles.letterSpacing = node.style.letterSpacing;
    }
  }

  if (node.fills && node.fills.length > 0 && node.fills[0].type === "SOLID") {
    textStyles.color = rgbToHex(node.fills[0].color);
  }

  // style={{...}}: the outer braces open a JSX expression, the inner ones are the object.
  // The text goes through JSON.stringify so quotes, { } and < > in a design cannot break the JSX.
  return `<Text style={${JSON.stringify(textStyles)}}>
{${JSON.stringify(node.characters ?? "")}}
</Text>\n`;
}

  if (node.children) {
    const styles = extractStyles(node);

    code += `<View style={${JSON.stringify(styles)}}>\n`;

    node.children.forEach(child => {
      code += parseNode(child);
    });

    code += `</View>\n`;
  }

  return code;
}
app.get("/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "readFigma",
        description: "Read Figma design file",
        input_schema: {
          type: "object",
          properties: {
            fileId: { type: "string" }
          },
          required: ["fileId"]
        }
      },
      {
        name: "generateReactNative",
        description: "Generate React Native layout from design",
        input_schema: {
          type: "object",
          properties: {
            fileId: { type: "string" }
          },
          required: ["fileId"]
        }
      }
    ]
  });
});



app.post("/tool/readFigma", async (req, res) => {
  if (!FIGMA_TOKEN) {
    return res.status(500).json({ error: "FIGMA_TOKEN is not configured" });
  }
  const { fileId } = req.body;

  try {
    const response = await axios.get(
      `https://api.figma.com/v1/files/${fileId}`,
      {
        headers: {
          "X-Figma-Token": FIGMA_TOKEN
        }
      }
    );

    res.json({
      success: true,
      name: response.data.name,
      lastModified: response.data.lastModified,
      document: response.data.document
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Figma file",
      details: error.response?.data || error.message
    });
  }
});

app.post("/tool/generateReactNative", async (req, res) => {
  if (!FIGMA_TOKEN) {
    return res.status(500).json({ error: "FIGMA_TOKEN is not configured" });
  }
  const { fileId } = req.body;

  try {
    const response = await axios.get(
      `https://api.figma.com/v1/files/${fileId}`,
      {
        headers: {
          "X-Figma-Token": FIGMA_TOKEN,
        },
      }
    );

    const document = response.data.document;
    const page = document.children?.[0];
if (!page) {
  return res.status(400).json({ error: "No page found in document" });
} // First page
    let components = "";

page.children.forEach(node => {
  components += parseNode(node);
});
    const code = `
import React from 'react';
import { View, Text } from 'react-native';

export default function Screen() {
  return (
    <View style={{ padding: 20 }}>
      ${components}
    </View>
  );
}
`;

    res.json({ code });

  } catch (error) {
    res.status(500).json({
      error: "Failed to generate code",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
