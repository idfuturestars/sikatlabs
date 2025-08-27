import { db } from "../server/db";
import { roleModels, roleModelMilestones, userEiqScores } from "@shared/schema/roleModels";

async function seedRoleModels() {
  console.log("🌱 Seeding role models...");

  const roleModelData = [
    {
      id: "satya-nadella",
      name: "Satya Nadella",
      domain: "Technology Leadership",
      region: "Global",
      bio: "CEO of Microsoft, transformed the company culture and drove cloud innovation.",
      achievements: ["Led Microsoft's cloud transformation", "Increased market cap by 5x", "Championed inclusive culture"],
      currentAge: 57,
      strategicIQ: 95,
      technicalIQ: 88,
      creativeIQ: 85,
      socialIQ: 92
    },
    {
      id: "reid-hoffman",
      name: "Reid Hoffman",
      domain: "Entrepreneurship",
      region: "Global",
      bio: "Co-founder of LinkedIn and Partner at Greylock Partners.",
      achievements: ["Co-founded LinkedIn", "Authored The Start-up of You", "Early PayPal executive"],
      currentAge: 57,
      strategicIQ: 94,
      technicalIQ: 82,
      creativeIQ: 90,
      socialIQ: 96
    },
    {
      id: "jensen-huang",
      name: "Jensen Huang",
      domain: "AI/Hardware",
      region: "Global",
      bio: "CEO and founder of NVIDIA, pioneer in GPU computing and AI acceleration.",
      achievements: ["Founded NVIDIA", "Led AI revolution", "Pioneer in parallel computing"],
      currentAge: 61,
      strategicIQ: 96,
      technicalIQ: 98,
      creativeIQ: 88,
      socialIQ: 85
    },
    {
      id: "elon-musk",
      name: "Elon Musk",
      domain: "Innovation",
      region: "Global",
      bio: "CEO of Tesla and SpaceX, entrepreneur focused on sustainable energy and space exploration.",
      achievements: ["Founded SpaceX", "CEO of Tesla", "Revolutionized electric vehicles"],
      currentAge: 53,
      strategicIQ: 98,
      technicalIQ: 95,
      creativeIQ: 99,
      socialIQ: 78
    },
    {
      id: "oprah-winfrey",
      name: "Oprah Winfrey",
      domain: "Media/Leadership",
      region: "Global",
      bio: "Media mogul, philanthropist, and influential cultural leader.",
      achievements: ["Built media empire", "Philanthropic leadership", "Cultural influence"],
      currentAge: 70,
      strategicIQ: 92,
      technicalIQ: 75,
      creativeIQ: 96,
      socialIQ: 99
    }
  ];

  // Insert role models
  for (const roleModel of roleModelData) {
    await db.insert(roleModels).values(roleModel).onConflictDoNothing();
  }

  // Insert milestones for Satya Nadella
  const satyaMilestones = [
    { roleModelId: "satya-nadella", age: 25, year: 1992, milestone: "Joined Microsoft", description: "Started as Program Manager", orderIndex: 1 },
    { roleModelId: "satya-nadella", age: 47, year: 2014, milestone: "Became CEO", description: "Appointed CEO of Microsoft", orderIndex: 2 },
    { roleModelId: "satya-nadella", age: 50, year: 2017, milestone: "Cloud Leadership", description: "Azure became #2 cloud platform", orderIndex: 3 }
  ];

  for (const milestone of satyaMilestones) {
    await db.insert(roleModelMilestones).values(milestone).onConflictDoNothing();
  }

  // Insert milestones for Reid Hoffman
  const reidMilestones = [
    { roleModelId: "reid-hoffman", age: 35, year: 2002, milestone: "Founded LinkedIn", description: "Co-founded professional networking platform", orderIndex: 1 },
    { roleModelId: "reid-hoffman", age: 49, year: 2016, milestone: "Microsoft Acquisition", description: "LinkedIn acquired by Microsoft for $26.2B", orderIndex: 2 }
  ];

  for (const milestone of reidMilestones) {
    await db.insert(roleModelMilestones).values(milestone).onConflictDoNothing();
  }

  // Create EIQ scores for demo user for matching
  await db.insert(userEiqScores).values({
    userId: "42571909", // Demo user ID
    strategic: 75,
    technical: 78,
    creative: 82,
    social: 76
  }).onConflictDoNothing();

  console.log("✅ Role models seeded successfully");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedRoleModels().then(() => {
    console.log("Role model seeding complete");
    process.exit(0);
  }).catch(console.error);
}

export { seedRoleModels };