docker build -t vqlabs/vqmarketplaceplatform .
docker tag vqlabs/vqmarketplaceplatform:latest 481877795925.dkr.ecr.us-east-1.amazonaws.com/vqmarketplaceplatform:latest
docker push 481877795925.dkr.ecr.us-east-1.amazonaws.com/vqmarketplaceplatform:latest