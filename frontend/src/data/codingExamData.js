// Coding Exam Data - replaces multiple choice with actual coding challenges

const pythonCodingExam = {
  title: "Python Fundamentals",
  route: "python",
  examTitle: "Python Coding Exam",
  examDescription: "Complete coding challenges to test your Python programming skills.",
  challenges: [
    {
      id: 1,
      title: "Hello World",
      description: "Write a program that prints 'Hello, World!' to the console.",
      starterCode: `# Write your code here
print("Your code here")`,
      solution: `print("Hello, World!")`,
      testCases: [
        {
          description: "Should print 'Hello, World!'",
          input: "",
          expectedOutput: "Hello, World!"
        }
      ],
      points: 100,
      hints: [
        "Use the print() function to display text",
        "Remember to include quotes around the text"
      ]
    },
    {
      id: 2,
      title: "Variable Assignment",
      description: "Create a variable called 'name' with value 'John' and print it.",
      starterCode: `# Create a name variable and print it
print("")`,
      solution: `name = "John"
print(name)`,
      testCases: [
        {
          description: "Should print the name variable",
          input: "",
          expectedOutput: "John"
        }
      ],
      points: 100,
      hints: [
        "Use the assignment operator (=)",
        "Variable names don't need quotes when creating them"
      ]
    },
    {
      id: 3,
      title: "Basic Math",
      description: "Add two numbers (5 and 3) and print the result.",
      starterCode: `# Add 5 and 3 and print result
num1 = 5
num2 = 3
# Your code here`,
      solution: `num1 = 5
num2 = 3
result = num1 + num2
print(result)`,
      testCases: [
        {
          description: "Should print 8",
          input: "",
          expectedOutput: "8"
        }
      ],
      points: 100,
      hints: [
        "Use the + operator for addition",
        "You can store the result in another variable"
      ]
    },
    {
      id: 4,
      title: "If Statement",
      description: "Check if number 10 is positive and print 'Positive' if it is.",
      starterCode: `# Check if 10 is positive
number = 10
# Your code here`,
      solution: `number = 10
if number > 0:
    print("Positive")`,
      testCases: [
        {
          description: "Should print 'Positive' for positive number",
          input: "",
          expectedOutput: "Positive"
        }
      ],
      points: 100,
      hints: [
        "Use the > operator for comparison",
        "Remember the colon (:) after the if condition"
      ]
    },
    {
      id: 5,
      title: "For Loop",
      description: "Print numbers from 1 to 5, each on a new line.",
      starterCode: `# Print numbers 1 to 5 using for loop
# Your code here`,
      solution: `for i in range(1, 6):
    print(i)`,
      testCases: [
        {
          description: "Should print numbers 1-5, each on new line",
          input: "",
          expectedOutput: "1\n2\n3\n4\n5"
        }
      ],
      points: 100,
      hints: [
        "Use range(1, 6) to get numbers 1-5",
        "Remember to indent the code inside the loop"
      ]
    }
  ]
};

const cppCodingExam = {
  title: "C++ Fundamentals",
  route: "cpp",
  examTitle: "C++ Coding Exam",
  examDescription: "Complete coding challenges to test your C++ programming skills.",
  challenges: [
    {
      id: 1,
      title: "Hello World",
      description: "Write a C++ program that prints 'Hello, World!' to the console.",
      starterCode: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}`,
      solution: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
      testCases: [
        {
          description: "Should print 'Hello, World!'",
          input: "",
          expectedOutput: "Hello, World!"
        }
      ],
      points: 100,
      hints: [
        "Include the iostream header",
        "Use cout to output text"
      ]
    }
  ]
};

const javascriptCodingExam = {
  title: "JavaScript Fundamentals",
  route: "javascript",
  examTitle: "JavaScript Coding Exam",
  examDescription: "Complete coding challenges to test your JavaScript programming skills.",
  challenges: [
    {
      id: 1,
      title: "Hello World",
      description: "Write a JavaScript program that logs 'Hello, World!' to the console.",
      starterCode: `// Write your code here
console.log("Your code here");`,
      solution: `console.log("Hello, World!");`,
      testCases: [
        {
          description: "Should log 'Hello, World!'",
          input: "",
          expectedOutput: "Hello, World!"
        }
      ],
      points: 100,
      hints: [
        "Use console.log() to output text",
        "Remember to include quotes around the text"
      ]
    }
  ]
};

const codingExamsByLanguage = {
  python: pythonCodingExam,
  cpp: cppCodingExam,
  javascript: javascriptCodingExam
};

export const getCodingExamData = (language = "python") => {
  const normalized = String(language || "python").toLowerCase();
  return codingExamsByLanguage[normalized] || pythonCodingExam;
};
