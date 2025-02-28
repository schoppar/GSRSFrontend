 #!/bin/bash
setup_git() {
  cd ../
ls
  git clone https://GsrsBot:${GIT_ACCESS_TOKEN}@github.com/ncats/gsrs-ci.git
cd gsrs-ci
ls
git status
git fetch
git branch -a
git status
git checkout fda_staged_sync
  git pull
  git merge origin/fda
  cd gsrs-ci

cp -r frontend/src/main/resources/static/substanceRelationshipVisualizer ./
rm -rf frontend/src/main/resources/static
mkdir frontend/src/main/resources/static
cp -r ../GSRSFrontend/dist/browser/* frontend/src/main/resources/static/
cp -r ./substanceRelationshipVisualizer frontend/src/main/resources/static/
rm -rf ./substanceRelationshipVisualizer
git add frontend/src/main/resources/static
git add -u 
git commit -m "pushing new frontend build"
git status
ls
git push -u origin fda_staged_sync


 cd ../
  rm -rf gsrs-ci
  ls -l
  git clone https://GsrsBot:${GIT_ACCESS_TOKEN}@github.com/ncats/gsrs-ci.git
cd gsrs-ci
git status
git fetch
git branch -a
git status
git checkout master_staged_sync
git pull
git merge origin/master
cp -r frontend/src/main/resources/static/substanceRelationshipVisualizer ./
cp frontend/src/main/resources/static/assets/data/config.json ./
rm -rf frontend/src/main/resources/static
mkdir frontend/src/main/resources/static

cp -r ../GSRSFrontend/dist/browser/* frontend/src/main/resources/static/
cp -r ./substanceRelationshipVisualizer frontend/src/main/resources/static/
cp ./config.json frontend/src/main/resources/static/assets/data/
rm ./config.json
rm -rf ./substanceRelationshipVisualizer
git add frontend/src/main/resources/static
git add -u 
git commit -m "travis test before build"
git status
ls
git push -u origin master_staged_sync
}


setup_git
