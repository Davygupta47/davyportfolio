import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Dwaipayan",
  lastName: "Dasgupta",
  name: `Dwaipayan Dasgupta`,
  role: "AI/ML Engineer",
  avatar: "/images/my.jpg",
  email: "dwaipayan.dg07@gmail.com",
  location: "Asia/Kolkata",
  languages: ["English", "Hindi", "Bengali"],
};

const newsletter: Newsletter = {
  display: false,
  title: <>Subscribe to {person.firstName}'s Newsletter</>,
  description: <>My weekly newsletter about creativity and engineering</>,
};

const social: Social = [
  // Links are automatically displayed.
  // Import new icons in /once-ui/icons.ts
  // Set essentials: true for links you want to show on the about page
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/Davygupta47",
    essential: true,
  },
  {
    name: "Instagram",
    icon: "instagram",
    link: "https://www.instagram.com/davygupta47/",
    essential: false,
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://linkedin.com/in/dwaipayan-dasgupta-b97b38319",
    essential: true,
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
    essential: true,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Portfolio website showcasing my work as an ${person.role}`,
  headline: <>Transforming data into actionable insights</>,
  featured: {
    display: true,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">Featured</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Projects
        </Text>
      </Row>
    ),
    href: "/work",
  },
  subline: (
    <>
      I'm Dwaipayan, an AI/ML undergraduate specializing in <Text as="span" size="xl" weight="strong">Machine Learning and Deep Learning</Text>, developing impactful AI-driven solutions.
    </>
  ),
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `Meet ${person.name}, ${person.role} from Kolkata, India`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: false,
    link: "https://cal.com",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        An AI/ML undergraduate specializing in Machine Learning, Deep Learning, Artificial Intelligence, and algorithms. Experienced in transforming data into meaningful, actionable insights using modern programming languages and frameworks. Dedicated to developing impactful AI-driven solutions and possesses strong team management, collaboration, and problem-solving skills to ensure successful product development.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Work Experience",
    experiences: [
      {
        company: "Fizofy (Startup)",
        timeframe: "Oct 2025 - Jan 2026",
        role: "Technical Team Lead",
        achievements: [
          <>
            Led a cross-functional team to develop and launch AI-driven health features, including personalized diet planning and real-time fitness tracking.
          </>,
          <>
            Managed project timelines and coordinated team efforts to ensure the successful delivery of high-quality, HIPAA-compliant healthcare solutions.
          </>,
          <>
            Mentored team members and fostered a collaborative environment, driving continuous improvement in product development and user satisfaction.
          </>,
        ],
        images: [],
      },
      {
        company: "American Society of Microbiology",
        timeframe: "Aug 2024 - Jan 2026",
        role: "Global Outreach Student",
        achievements: [
          <>
            Promoted microbial science to a global audience by organizing educational events and networking opportunities for students and professionals.
          </>,
          <>
            Shared scientific research through workshops and outreach programs to help make complex microbiology accessible, and implemented cutting-edge AI technology for a better understanding of structures.
          </>,
        ],
        images: [],
      },
      {
        company: "Zidio Development",
        timeframe: "Jan 2025 - Apr 2025",
        role: "Data Research Analyst",
        achievements: [
          <>
            Extracted and synthesized large datasets using Python and SQL to identify emerging market trends, providing actionable insights that informed strategic project planning.
          </>,
          <>
            Developed interactive dashboards in Power BI/Tableau to visualize complex research findings, enabling stakeholders to make data-driven decisions with greater speed and accuracy.
          </>,
          <>
            Streamlined data collection and cleaning workflows by implementing automated scripts, significantly reducing manual errors and improving the reliability of research outputs.
          </>,
        ],
        images: [],
      },
    ],
  },
  studies: {
    display: true, // set to false to hide this section
    title: "Education",
    institutions: [
      {
        name: "Heritage Institute of Technology",
        description: <>B.Tech in Computer Science Engineering (AI & ML), located in Kolkata, WB. (2023-2027)</>,
      },
      {
        name: "Delhi Public School, Joka",
        description: <>Central Board of Secondary Education (CBSE) (2021-2023)</>,
      },
      {
        name: "Vivekananda Mission School, Joka",
        description: <>Indian Certificate of Secondary Education (ICSE) (2021)</>,
      },
    ],
  },
  technical: {
    display: true,
    title: "Technical Skills",
    skills: [
      {
        title: "Languages",
        description: (
          <>Python, R, C, C++, SQL, Java, MATLAB</>
        ),
        tags: [],
        images: [],
      },
      {
        title: "Frameworks",
        description: (
          <>PyTorch, TensorFlow, Keras, LangChain, MLflow, Apache Spark, AWS Sagemaker, Kubernetes</>
        ),
        tags: [],
        images: [],
      },
      {
        title: "Tools / Developer Tools",
        description: (
          <>Git, GitHub, MongoDB, PostgreSQL, Docker, Weka, Power BI, Tableau</>
        ),
        tags: [],
        images: [],
      },
      {
        title: "Analysis & Research",
        description: (
          <>Data Analysis, Business Intelligence, Feasibility Studies, Performance Metrics</>
        ),
        tags: [],
        images: [],
      },
      {
        title: "Leadership & Soft Skills",
        description: (
          <>Team Leadership, Time Management, Problem Solving, Critical Thinking, Effective Communication</>
        ),
        tags: [],
        images: [],
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Blog",
  title: "Writing about AI and tech...",
  description: `Read what ${person.name} has been up to recently`,
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: `Projects – ${person.name}`,
  description: `AI/ML projects by ${person.name}`,
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Gallery",
  title: `Photo gallery – ${person.name}`,
  description: `A photo collection by ${person.name}`,
  images: [
    {
      src: "/images/gallery/horizontal-1.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-4.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-3.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-1.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/vertical-2.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-2.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/horizontal-4.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-3.jpg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };
