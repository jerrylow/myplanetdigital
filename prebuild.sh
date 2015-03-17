#!/bin/bash

echo "Set up $GH_REPO [via travis] for $GIT_NAME <${GIT_EMAIL}>"
export REPO_URL="https://$GH_TOKEN@github.com/$GH_REPO.git"
git config --global user.email "$GIT_EMAIL"
git config --global user.name "$GIT_NAME"

echo "Resetting origin url to $REPO_URL"
git remote rm origin
git remote add origin $REPO_URL
 
git remote -v

#echo "DEBUG, cd out"
#test -d out && (
#  cd out
#  echo -n "user.email"
#  git config user.email
#  echo -n "user.name"
#  git config user.name
#
#) || echo "fresh build, no out directory"
