const fs = require('fs').promises;
const path = require('path');

(async function generateProjects() {
  const root = path.join(__dirname, '..');
  const projectsDir = path.join(root, 'Projects');
  const outputFile = path.join(root, 'projects.json');

  try {
    const entries = await fs.readdir(projectsDir, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory());

    const projects = [];

    for (const folder of folders) {
      const folderPath = path.join(projectsDir, folder.name);
      const projectFiles = await fs.readdir(folderPath);
      const imageFile = projectFiles.find((file) => /^project_image(?:\.[a-zA-Z0-9]+)?$/i.test(file));
      const jsonFile = projectFiles.find((file) => /project(?:\.json|\.js|\.txt)$/i.test(file));

      if (!imageFile) {
        console.warn(`Skipping project folder ${folder.name} because it has no project_image file.`);
        continue;
      }

      let metadata = {
        name: folder.name,
        shortDescription: 'A project folder with a representative image.',
        description: 'This project was discovered inside the Projects folder. Add a project.json file to provide a richer description.',
        tags: []
      };

      if (jsonFile) {
        const jsonPath = path.join(folderPath, jsonFile);
        try {
          const raw = await fs.readFile(jsonPath, 'utf8');
          const parsed = JSON.parse(raw);
          metadata = {
            ...metadata,
            ...parsed,
            tags: Array.isArray(parsed.tags) ? parsed.tags : metadata.tags
          };
        } catch (error) {
          console.warn(`Unable to read metadata for ${folder.name}:`, error.message);
        }
      }

      const imageUrl = path.relative(root, path.join(folderPath, imageFile)).split(path.sep).join('/');

      projects.push({
        name: metadata.name,
        shortDescription: metadata.shortDescription,
        description: metadata.description,
        tags: metadata.tags,
        image: imageUrl,
        folder: folder.name
      });
    }

    await fs.writeFile(outputFile, JSON.stringify(projects, null, 2), 'utf8');
    console.log(`Generated ${projects.length} project(s) in ${outputFile}`);
  } catch (error) {
    console.error('Failed to generate project metadata:', error.message);
    process.exit(1);
  }
})();
