export function generateBuildYml(
  name: string,
  containerPort: number,
  url: string
): string {
  return `name: Build and Push MCP Image

on:
  workflow_dispatch:
  push:
    branches:
      - main

jobs:
  build-and-push-image:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout source repo
        uses: actions/checkout@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: \${{ secrets.DOCKERHUB_USERNAME }}
          password: \${{ secrets.DOCKER_SECRET }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build Docker and push the docker image
        uses: docker/build-push-action@v2
        with:
          context: .
          file: Dockerfile
          push: true
          tags: govindup63/plane:\${{ github.sha }}

      - name: Generate MCP YAML file
        run: |
          cat <<EOF > \${GITHUB_WORKSPACE}/plane-\${{ github.sha }}.yml
          apiVersion: kro.run/v1alpha1
          kind: MCP
          metadata:
            name: ${name}
            namespace: hackman-hackathon
          spec:
            name: ${name}
            image: govindup63/plane:\${{ github.sha }}
            replicas: 1
            namespace: hackman-hackathon
            containerPort: ${containerPort}
            ingress:
              enabled: true
              url: ${url}
              path: /
              pathType: Prefix
          EOF

      - name: Push generated YAML to worker repo
        env:
          GH_PAT: \${{ secrets.ARGOCD_PAT}}
        run: |
          git clone https://\${GH_PAT}@github.com/govindup63/mcps.git
          cd mcps
          cp "\${GITHUB_WORKSPACE}/plane-\${{ github.sha }}.yml" .
          git config user.name "github-actions[bot]"
          git config user.email "actions@github.com"
          git add .
          git commit -m "Add MCP config for ${name}-\${{ github.sha }}"
          git push https://\${GH_PAT}@github.com/govindup63/mcps.git main || echo "Nothing to push"
`;
}
